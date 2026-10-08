/**
 * Talking to archive.org.
 *
 * The obvious download URL — `https://archive.org/download/<item>/<file>` — is
 * not dependable. For the `attitude5` item it currently answers **HTTP 500 for
 * every file it holds**: the load balancer redirects to a stale node path
 * (`dn721308.ca.archive.org/0/items/attitude5/`) while the item actually lives
 * at `/7/items/attitude5` on `ia801602.us.archive.org`.
 *
 * The metadata API reports both the item's real host and directory *and* the
 * exact names of the 900-odd files it contains. So instead of guessing at
 * filename spellings, we resolve the requested name against that listing and
 * use whatever the file is actually called.
 *
 * That matters because the library has drifted into three spellings of the same
 * name: 287 tracks kept the spaces from archive.org's web uploader, 11 were
 * uploaded by the admin dashboard which replaces spaces with underscores, and
 * at least one — `Reconciliation - series 8 .mp3` — has a stray space before
 * its extension. Normalised lookup reconciles all three.
 */

const METADATA_ENDPOINT = "https://archive.org/metadata/";
const DOWNLOAD_ENDPOINT = "https://archive.org/download/";

/** How long a resolved item is trusted before we ask metadata again. */
export const ITEM_TTL_SECONDS = 3600;

export interface ArchiveItem {
  /** Canonical host for the item, e.g. `ia801602.us.archive.org`. */
  server: string;
  /** Absolute directory on that host, e.g. `/7/items/attitude5`. */
  dir: string;
  /** Secondary hosts to try if the canonical one misbehaves. */
  alternates: string[];
  /** Exact filenames, for an O(1) "is this already right?" check. */
  exactNames: Set<string>;
  /** Normalised filename -> exact filename as stored. */
  fileIndex: Record<string, string>;
}

/**
 * Fold away the differences that do not change which file a person means:
 * case, runs of underscores/spaces, and whitespace before the extension.
 */
export function normaliseFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+(\.[a-z0-9]+)$/, "$1")
    .replace(/[_\s]+/g, " ")
    .trim();
}

function asHost(value: unknown): string | null {
  // Only accept a bare hostname. Anything carrying a scheme, path or port is
  // not something we are willing to interpolate into a URL.
  if (typeof value !== "string") return null;
  if (!/^[a-z0-9.-]+$/i.test(value)) return null;
  return value;
}

function emptyItem(server: string, dir: string, alternates: string[]): ArchiveItem {
  return { server, dir, alternates, exactNames: new Set(), fileIndex: {} };
}

interface MetadataResponse {
  server?: unknown;
  dir?: unknown;
  d1?: unknown;
  d2?: unknown;
  files?: unknown;
}

/**
 * Ask archive.org where an item lives and what it holds. Returns `null` when
 * the item is unknown or the response is malformed, so callers can fall back to
 * `/download/` unaided.
 */
export async function fetchArchiveItem(item: string): Promise<ArchiveItem | null> {
  let response: Response;
  try {
    response = await fetch(METADATA_ENDPOINT + encodeURIComponent(item), {
      headers: { accept: "application/json" },
    });
  } catch {
    return null;
  }
  if (!response.ok) return null;

  let metadata: MetadataResponse;
  try {
    metadata = (await response.json()) as MetadataResponse;
  } catch {
    return null;
  }

  const server = asHost(metadata.server);
  const dir = typeof metadata.dir === "string" && metadata.dir.startsWith("/") ? metadata.dir : null;
  if (!server || !dir) return null;

  const alternates = [asHost(metadata.d1), asHost(metadata.d2)].filter(
    (host): host is string => host !== null && host !== server,
  );

  const resolved = emptyItem(server, dir, alternates);

  if (Array.isArray(metadata.files)) {
    for (const entry of metadata.files) {
      const name = (entry as { name?: unknown } | null)?.name;
      if (typeof name !== "string" || name.length === 0) continue;
      resolved.exactNames.add(name);
      const key = normaliseFilename(name);
      // First spelling wins; collisions are harmless, both files exist.
      if (resolved.fileIndex[key] === undefined) resolved.fileIndex[key] = name;
    }
  }

  return resolved;
}

/**
 * Filenames worth trying, most likely to succeed first. Names confirmed against
 * the item's own file listing come before mechanical spelling variants, which
 * only matter when metadata was unavailable.
 */
export function candidateFilenames(file: string, item: ArchiveItem | null): string[] {
  const candidates: string[] = [];
  const push = (name: string | undefined): void => {
    if (name !== undefined && name.length > 0 && !candidates.includes(name)) candidates.push(name);
  };

  if (item) {
    if (item.exactNames.has(file)) push(file);
    push(item.fileIndex[normaliseFilename(file)]);
  }

  push(file);
  push(file.replace(/\s+(\.[A-Za-z0-9]+)$/, "$1"));
  if (file.includes("_")) push(file.replace(/_/g, " "));
  if (file.includes(" ")) push(file.replace(/ /g, "_"));

  return candidates;
}

/** Ordered list of absolute URLs to attempt. */
export function buildCandidateUrls(
  item: string,
  file: string,
  archiveItem: ArchiveItem | null,
): string[] {
  const names = candidateFilenames(file, archiveItem);
  const urls: string[] = [];

  if (archiveItem) {
    for (const host of [archiveItem.server, ...archiveItem.alternates]) {
      for (const name of names) {
        urls.push(`https://${host}${archiveItem.dir}/${encodeURIComponent(name)}`);
      }
    }
  }

  const encodedItem = encodeURIComponent(item);
  for (const name of names) {
    urls.push(`${DOWNLOAD_ENDPOINT}${encodedItem}/${encodeURIComponent(name)}`);
  }

  return [...new Set(urls)];
}

/**
 * True when a status means "this URL is not the one" rather than "here is your
 * file". 416 is deliberately excluded: it is a valid answer to a Range request
 * describing the real file.
 */
export function isRetryableStatus(status: number): boolean {
  return status === 403 || status === 404 || status >= 500;
}

/**
 * Fetch the first candidate that responds with something usable, preserving any
 * `Range` header so the client gets a real 206 and can resume.
 */
export async function fetchFirstAvailable(
  urls: string[],
  init: { method: string; range: string | null; ifRange: string | null },
): Promise<Response | null> {
  const headers = new Headers();
  if (init.range) headers.set("range", init.range);
  if (init.ifRange) headers.set("if-range", init.ifRange);

  let lastResponse: Response | null = null;

  for (const url of urls) {
    let response: Response;
    try {
      response = await fetch(url, { method: init.method, headers, redirect: "follow" });
    } catch {
      continue;
    }

    if (!isRetryableStatus(response.status)) return response;

    // Drain the failed body so the connection can be reused.
    void response.body?.cancel();
    lastResponse = response;
  }

  return lastResponse;
}
