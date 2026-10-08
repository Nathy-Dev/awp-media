/**
 * Track integrity check.
 *
 * Resolves every track reference in `public/sermons.json` against the real file
 * listing of its archive.org item, and writes the ones that do not exist to
 * `public/track-availability.json`. The sermon detail page reads that file and
 * renders those rows as a disabled "Unavailable" row instead of a link that
 * 404s.
 *
 * Five references in the library were never uploaded (Pillars of Truth series
 * 8–10, My Major Assignment series 7–8). A sixth, `Reconciliation - series 8
 * .mp3`, exists under a name with a stray space — the Worker's filename
 * resolution handles that one, so it is reported as available.
 *
 * Run: npm run check-tracks
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SERMONS_FILE = path.join(ROOT, "public", "sermons.json");
const OUT_FILE = path.join(ROOT, "public", "track-availability.json");

/**
 * Mirrors `normaliseFilename` in cloudflare-worker/src/archive.ts: lowercase,
 * collapse underscores and runs of whitespace, and drop whitespace before the
 * extension. Kept in step with the Worker so this check does not disagree with
 * what a download actually resolves.
 */
function normaliseFilename(name) {
  return name
    .toLowerCase()
    .replace(/\s+(\.[a-z0-9]+)$/, "$1")
    .replace(/[_\s]+/g, " ")
    .trim();
}

function parseArchiveUrl(url) {
  const match = /archive\.org\/(?:download|details)\/([^/?#]+)\/([^?#]+)/.exec(url);
  if (match === null) return null;
  try {
    return { item: decodeURIComponent(match[1]), file: decodeURIComponent(match[2]) };
  } catch {
    return null;
  }
}

/** Item name -> set of normalised filenames it actually contains. */
const itemCache = new Map();

async function filesInItem(item) {
  const cached = itemCache.get(item);
  if (cached !== undefined) return cached;

  const response = await fetch(`https://archive.org/metadata/${encodeURIComponent(item)}`);
  if (!response.ok) {
    throw new Error(`Could not read metadata for "${item}" (${response.status})`);
  }

  const metadata = await response.json();
  if (typeof metadata?.error === "string") throw new Error(metadata.error);

  const files = new Set(
    (Array.isArray(metadata?.files) ? metadata.files : [])
      .map((entry) => normaliseFilename(String(entry?.name ?? "")))
      .filter((name) => name.length > 0),
  );

  itemCache.set(item, files);
  return files;
}

async function main() {
  const sermons = JSON.parse(await readFile(SERMONS_FILE, "utf8"));
  if (!Array.isArray(sermons)) throw new Error("public/sermons.json is not an array");

  const unavailable = [];
  const unknownItem = [];
  let total = 0;
  let remote = 0;

  for (const sermon of sermons) {
    for (const track of Array.isArray(sermon?.tracks) ? sermon.tracks : []) {
      const url = typeof track?.file === "string" ? track.file : "";
      if (url.length === 0) continue;
      total += 1;

      const ref = parseArchiveUrl(url);
      if (ref === null) continue; // Not archive.org — nothing to check.
      remote += 1;

      let files;
      try {
        files = await filesInItem(ref.item);
      } catch (error) {
        unknownItem.push(`${sermon.id} :: ${ref.item} — ${error.message}`);
        continue;
      }

      if (!files.has(normaliseFilename(ref.file))) {
        unavailable.push({ sermon: sermon.id, title: sermon.title, label: track.label, file: url });
      }
    }
  }

  await writeFile(
    OUT_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        // The client compares by full URL, which is what it has in hand.
        unavailable: unavailable.map((entry) => entry.file),
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`[tracks] ${total} references checked (${remote} on archive.org).`);
  console.log(`[tracks] ${unavailable.length} unresolved, written to public/track-availability.json.`);

  for (const entry of unavailable) {
    console.log(`  · ${entry.title} — ${entry.label}`);
  }
  for (const entry of unknownItem) {
    console.warn(`  ! could not verify: ${entry}`);
  }

  if (unavailable.length === 0) console.log("[tracks] Every reference resolves. ✨");
}

main().catch((error) => {
  // Availability data is an enhancement; a network failure here must not fail
  // the build. The client treats a missing file as "everything is available".
  console.error("[tracks] check failed, leaving the previous data in place:", error.message);
});
