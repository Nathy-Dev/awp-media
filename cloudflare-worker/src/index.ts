/**
 * AWPW download proxy.
 *
 * Serves sermon audio and cover art from archive.org with a
 * `Content-Disposition` header, which is the whole reason this Worker exists:
 * archive.org's own node responses carry no such header, so iOS Safari plays an
 * MP3 instead of saving it, and the filename a user ends up with is whatever
 * archive.org happens to call the file.
 *
 * Two routes:
 *   GET|HEAD /download?item=&file=&label=   audio, forced attachment
 *   GET|HEAD /img?item=&file=               cover art, served inline
 *
 * Both stream the upstream body straight through, so a 56MB file costs no
 * Worker memory and there is no execution-time ceiling to hit mid-download.
 */

import {
  ITEM_TTL_SECONDS,
  buildCandidateUrls,
  fetchArchiveItem,
  fetchFirstAvailable,
  isRetryableStatus,
  type ArchiveItem,
} from "./archive";

export interface Env {
  DEFAULT_ITEM: string;
}

const MAX_ITEM_LENGTH = 100;
const MAX_FILE_LENGTH = 300;
const MAX_LABEL_LENGTH = 200;

/**
 * Characters we are willing to put in a URL path. Deliberately narrow: upstream
 * URLs are built by concatenation, so this check is load-bearing.
 */
const SAFE_SEGMENT = /^[A-Za-z0-9 ._&'()[\]\-]+$/;

const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, HEAD, OPTIONS",
  "access-control-allow-headers": "Range, If-Range, Content-Type",
  "access-control-expose-headers":
    "Content-Disposition, Content-Length, Content-Range, Accept-Ranges",
};

const PASS_THROUGH_HEADERS = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "last-modified",
  "etag",
] as const;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Reject anything that could escape the path segment it is interpolated into.
 * Returns the trimmed value, or `null` if it is not safe to use.
 */
function sanitiseSegment(value: string | null, maxLength: number): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return null;
  if (trimmed.includes("..")) return null;
  if (trimmed.includes("/") || trimmed.includes("\\")) return null;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) return null;
  if (!SAFE_SEGMENT.test(trimmed)) return null;
  return trimmed;
}

// ---------------------------------------------------------------------------
// Naming
// ---------------------------------------------------------------------------

/**
 * `Content-Disposition` with both an ASCII fallback and the RFC 5987 form. Both
 * are needed: sermon titles contain typographic apostrophes, ampersands and
 * em-dashes, and older clients only understand the quoted string.
 */
function contentDisposition(filename: string, type: "attachment" | "inline"): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(filename).replace(
    /['()*]/g,
    (character) => "%" + character.charCodeAt(0).toString(16).toUpperCase(),
  );
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

/**
 * The name the user's device will save the file under. Prefers the human label
 * from `sermons.json` over archive.org's filename, which is often underscored
 * and machine-generated.
 */
function downloadFilename(label: string | null, file: string): string {
  const trimmedLabel = label?.trim().slice(0, MAX_LABEL_LENGTH) ?? "";
  const base = trimmedLabel.length > 0 ? trimmedLabel : file.replace(/\.[^.]+$/, "");
  const withoutExtension = base.replace(/\.(mp3|m4a|wav|ogg|opus)$/i, "");
  const cleaned = withoutExtension
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[/\\]/g, "-")
    .trim()
    .slice(0, 180)
    .trim();
  return `${cleaned.length > 0 ? cleaned : "sermon"}.mp3`;
}

// ---------------------------------------------------------------------------
// Item resolution cache
// ---------------------------------------------------------------------------

const itemCache = caches.default;

function itemCacheKey(item: string): Request {
  return new Request(`https://awp-download.internal/item/${encodeURIComponent(item)}`);
}

/** Shape written to the cache — `exactNames` is a Set and does not survive JSON. */
interface CachedItem extends Omit<ArchiveItem, "exactNames"> {
  exactNames: string[];
}

function encodeItem(item: ArchiveItem): CachedItem {
  return { ...item, exactNames: [...item.exactNames] };
}

function decodeItem(cached: CachedItem): ArchiveItem {
  return { ...cached, exactNames: new Set(cached.exactNames) };
}

/**
 * Resolve an item's host, directory and file listing, memoised for an hour. One
 * metadata call per item per hour, not one per download.
 */
async function resolveItem(item: string): Promise<ArchiveItem | null> {
  const key = itemCacheKey(item);
  const cached = await itemCache.match(key);
  if (cached) {
    try {
      return decodeItem((await cached.json()) as CachedItem);
    } catch {
      // Fall through and re-resolve.
    }
  }

  const resolved = await fetchArchiveItem(item);
  if (resolved) {
    await itemCache.put(
      key,
      new Response(JSON.stringify(encodeItem(resolved)), {
        headers: {
          "content-type": "application/json",
          "cache-control": `max-age=${ITEM_TTL_SECONDS}`,
        },
      }),
    );
  }
  return resolved;
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS_HEADERS },
  });
}

function buildHeaders(upstream: Response, disposition: string): Headers {
  const headers = new Headers();
  for (const name of PASS_THROUGH_HEADERS) {
    const value = upstream.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  if (!headers.has("accept-ranges")) headers.set("accept-ranges", "bytes");
  headers.set("content-disposition", disposition);
  for (const [name, value] of Object.entries(CORS_HEADERS)) headers.set(name, value);

  // A partial response must never be cached as if it were the whole file.
  headers.set(
    "cache-control",
    upstream.status === 206 ? "no-store" : "public, max-age=31536000, immutable",
  );
  return headers;
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

interface StreamOptions {
  disposition: (filename: string) => string;
  fallbackName: (label: string | null, file: string) => string;
}

async function streamFromArchive(
  request: Request,
  env: Env,
  options: StreamOptions,
): Promise<Response> {
  const url = new URL(request.url);
  const item = sanitiseSegment(url.searchParams.get("item") ?? env.DEFAULT_ITEM, MAX_ITEM_LENGTH);
  const file = sanitiseSegment(url.searchParams.get("file"), MAX_FILE_LENGTH);
  const label = url.searchParams.get("label");

  if (item === null || file === null) {
    return json({ error: "invalid_request", detail: "A valid 'item' and 'file' are required." }, 400);
  }

  const resolved = await resolveItem(item);
  const candidates = buildCandidateUrls(item, file, resolved);

  const method = request.method === "HEAD" ? "HEAD" : "GET";
  const upstream = await fetchFirstAvailable(candidates, {
    method,
    range: request.headers.get("range"),
    ifRange: request.headers.get("if-range"),
  });

  if (upstream === null) {
    return json({ error: "upstream_unreachable", item, file }, 502);
  }

  if (isRetryableStatus(upstream.status)) {
    void upstream.body?.cancel();
    return json(
      {
        error: "unavailable",
        detail: "No candidate URL for this file responded successfully.",
        item,
        file,
        upstreamStatus: upstream.status,
        attempted: candidates.length,
      },
      404,
    );
  }

  const filename = options.fallbackName(label, file);
  const headers = buildHeaders(upstream, options.disposition(filename));

  if (method === "HEAD") {
    void upstream.body?.cancel();
    return new Response(null, { status: upstream.status, headers });
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}

async function handleDownload(request: Request, env: Env): Promise<Response> {
  return streamFromArchive(request, env, {
    disposition: (filename) => contentDisposition(filename, "attachment"),
    fallbackName: downloadFilename,
  });
}

async function handleImage(request: Request, env: Env): Promise<Response> {
  return streamFromArchive(request, env, {
    disposition: (filename) => contentDisposition(filename, "inline"),
    fallbackName: (_label, file) => file,
  });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return json({ error: "method_not_allowed" }, 405);
    }

    switch (pathname) {
      case "/download":
        return handleDownload(request, env);

      case "/img":
        return handleImage(request, env);

      case "/health":
        return json({ status: "ok", service: "awp-download" }, 200);

      case "/":
        return json(
          {
            service: "awp-download",
            endpoints: {
              "/download": "GET|HEAD ?item=&file=&label= — audio, forced download",
              "/img": "GET|HEAD ?item=&file= — cover art, inline",
              "/health": "GET — liveness",
            },
          },
          200,
        );

      default:
        return json({ error: "not_found", path: pathname }, 404);
    }
  },
} satisfies ExportedHandler<Env>;
