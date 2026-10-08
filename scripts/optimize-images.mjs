/**
 * Build-time cover optimisation.
 *
 * Runs as `prebuild`, so every deploy regenerates `public/covers/` from
 * whatever is in `sermons.json`. Because the admin dashboard commits
 * `sermons.json` through the GitHub API and that triggers a Vercel rebuild, new
 * cover art is picked up automatically without anyone running this by hand.
 *
 * The grid used to load 24 full-size covers per page — about 8.4MB, with five
 * covers coming from archive.org at 1.8–2MB each. This emits WebP at three
 * widths instead, which brings a page view under 500KB.
 *
 *   public/covers/<slug>-320.webp
 *   public/covers/<slug>-640.webp
 *   public/covers/<slug>-960.webp
 *   public/covers/manifest.json
 *
 * Covers that cannot be read are skipped rather than failing the build: the
 * site falls back to the original URL for any sermon missing from the manifest.
 */

import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SERMONS_FILE = path.join(ROOT, "public", "sermons.json");
const PUBLIC_DIR = path.join(ROOT, "public");
const OUT_DIR = path.join(PUBLIC_DIR, "covers");

const WIDTHS = [320, 640, 960];
const QUALITY = 78;

/** Same resolution rule as the public client: archive.org is the special case. */
function parseArchiveUrl(url) {
  const match = /archive\.org\/(?:download|details)\/([^/?#]+)\/([^?#]+)/.exec(url);
  if (match === null) return null;
  try {
    return { item: decodeURIComponent(match[1]), file: decodeURIComponent(match[2]) };
  } catch {
    return null;
  }
}

/**
 * Turn a sermon image path into a filesystem path or a remote URL.
 *
 * `sermons.json` stores both `../images/x.jpg` (written for a page inside a
 * subdirectory) and `/images/x.jpg`.
 */
function resolveSource(image) {
  if (image.length === 0) return null;
  if (image.startsWith("http://") || image.startsWith("https://")) return { remote: image };

  const relative = image.replace(/^\.\.\//, "").replace(/^\//, "");
  return { local: path.join(PUBLIC_DIR, relative) };
}

/**
 * Resolve an archive.org file to a node that actually serves it.
 *
 * `archive.org/download/<item>/<file>` returns 500 for this library's item — a
 * stale redirect pointing at an old node — so the real server has to come from
 * the metadata API, exactly as the download Worker does it.
 */
async function resolveArchiveNode(item, file) {
  const response = await fetch(`https://archive.org/metadata/${encodeURIComponent(item)}`);
  if (!response.ok) return null;

  const metadata = await response.json();
  const server = metadata?.server;
  const dir = metadata?.dir;
  if (typeof server !== "string" || typeof dir !== "string") return null;

  // Match the file against the item's actual listing, since the stored name may
  // differ in whitespace or underscores from the one in sermons.json.
  const normalise = (name) => name.toLowerCase().replace(/\s+(\.[a-z0-9]+)$/, "$1").replace(/[_\s]+/g, " ").trim();
  const wanted = normalise(file);
  const files = Array.isArray(metadata?.files) ? metadata.files : [];
  const exact = files.find((entry) => normalise(String(entry?.name ?? "")) === wanted)?.name;

  return `https://${server}${dir}/${encodeURIComponent(exact ?? file)}`;
}

async function readSourceBuffer(source) {
  if (source.local !== undefined) {
    if (!existsSync(source.local)) return null;
    return await readFile(source.local);
  }

  const ref = parseArchiveUrl(source.remote);
  const candidates = ref === null ? [source.remote] : [await resolveArchiveNode(ref.item, ref.file), source.remote];

  for (const url of candidates) {
    if (url === null) continue;
    try {
      const response = await fetch(url);
      if (response.ok) return Buffer.from(await response.arrayBuffer());
    } catch {
      // Try the next candidate.
    }
  }
  return null;
}

/** Filesystem-safe, stable, and unique per sermon id. */
function slugify(id) {
  return id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function main() {
  if (!existsSync(SERMONS_FILE)) {
    console.warn("[covers] public/sermons.json not found — skipping optimisation.");
    return;
  }

  const sermons = JSON.parse(await readFile(SERMONS_FILE, "utf8"));
  if (!Array.isArray(sermons)) {
    console.warn("[covers] public/sermons.json is not an array — skipping optimisation.");
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });

  // Clear stale variants so a renamed or removed cover cannot linger. Files not
  // in `covers/` are untouched.
  for (const entry of await readdir(OUT_DIR)) {
    await rm(path.join(OUT_DIR, entry), { force: true });
  }

  const manifest = {};
  const usedSlugs = new Set();
  let optimised = 0;
  let skipped = 0;
  let sourceBytes = 0;
  let outputBytes = 0;

  for (const sermon of sermons) {
    const id = typeof sermon?.id === "string" ? sermon.id : null;
    const source = id === null ? null : resolveSource(String(sermon.image ?? ""));
    if (id === null || source === null) {
      skipped += 1;
      continue;
    }

    const buffer = await readSourceBuffer(source);
    if (buffer === null) {
      console.warn(`[covers] no image for "${id}" (${sermon.image}) — falling back to the original URL.`);
      skipped += 1;
      continue;
    }

    let slug = slugify(id);
    while (usedSlugs.has(slug)) slug = `${slug}-x`;
    usedSlugs.add(slug);

    try {
      const image = sharp(buffer).rotate();
      const metadata = await image.metadata();
      if (metadata.width === undefined || metadata.height === undefined) throw new Error("no dimensions");

      const targets = WIDTHS.filter((width) => width <= metadata.width);
      // Never emit nothing: a cover narrower than 320px keeps its own width.
      const widths = targets.length > 0 ? targets : [metadata.width];

      const sources = [];
      for (const width of widths) {
        const name = `${slug}-${width}.webp`;
        const info = await sharp(buffer).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(path.join(OUT_DIR, name));
        sources.push({ name, width: info.width });
        outputBytes += info.size;
      }

      const largest = sources[sources.length - 1];
      const ratio = metadata.height / metadata.width;

      manifest[id] = {
        src: `/covers/${largest.name}`,
        srcSet: sources.map((entry) => `/covers/${entry.name} ${entry.width}w`).join(", "),
        width: largest.width,
        height: Math.round(largest.width * ratio),
      };

      sourceBytes += buffer.byteLength;
      optimised += 1;
    } catch (error) {
      console.warn(`[covers] could not optimise "${id}": ${error.message}`);
      skipped += 1;
    }
  }

  await writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

  const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
  const saved = sourceBytes === 0 ? "n/a" : `${Math.round((1 - outputBytes / sourceBytes) * 100)}%`;
  console.log(
    `[covers] ${optimised} optimised, ${skipped} skipped. ` +
      `Source ${mb(sourceBytes)}MB across ${optimised} originals, ` +
      `output ${mb(outputBytes)}MB across all widths (${saved} smaller per original).`,
  );
}

main().catch((error) => {
  // A broken cover must not take the whole deploy down.
  console.error("[covers] optimisation failed, continuing with original images:", error);
});
