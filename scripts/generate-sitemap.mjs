/**
 * Sitemap generation.
 *
 * Runs as part of `prebuild`, so the sitemap is rebuilt every deploy. The admin
 * dashboard commits `sermons.json` through the GitHub API, which triggers a
 * Vercel rebuild — a newly published message appears here without anyone
 * remembering to edit XML by hand.
 *
 * The hand-written sitemap this replaces listed eight URLs, none of them a
 * sermon, and pointed at `/template/sermons.html`, which no longer exists.
 *
 * URLs are written without a trailing slash to match `vercel.json`'s
 * `trailingSlash: false`, which 308s the slashed form.
 *
 * Run: node scripts/generate-sitemap.mjs
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SERMONS_FILE = path.join(ROOT, "public", "sermons.json");
const OUT_FILE = path.join(ROOT, "public", "sitemap.xml");

const SITE_URL = "https://awpwmedia.org";

/**
 * Pages that exist for every visitor, in the order they matter.
 *
 * `/dashboard` is deliberately absent: it is an unlinked admin page and carries
 * `noindex`, so listing it would only invite crawlers to a tool page.
 */
const STATIC_ROUTES = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/more-messages", changefreq: "daily", priority: "0.9" },
  { path: "/foundation", changefreq: "daily", priority: "0.9" },
  { path: "/discipleship", changefreq: "daily", priority: "0.9" },
  { path: "/workers", changefreq: "daily", priority: "0.9" },
  { path: "/live", changefreq: "weekly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.7" },
];

/** `&`, `<` and `>` are the only characters that can appear in a URL unescaped. */
function escapeXml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function urlEntry(loc, lastmod, changefreq, priority) {
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

async function main() {
  // Sermons carry no per-item date, so the build date is the honest value: the
  // file is regenerated on every deploy.
  const lastmod = new Date().toISOString().slice(0, 10);

  const entries = STATIC_ROUTES.map((route) =>
    urlEntry(`${SITE_URL}${route.path}`, lastmod, route.changefreq, route.priority),
  );

  let sermonCount = 0;
  try {
    const sermons = JSON.parse(await readFile(SERMONS_FILE, "utf8"));
    if (Array.isArray(sermons)) {
      for (const sermon of sermons) {
        const id = typeof sermon?.id === "string" ? sermon.id : "";
        if (id.length === 0) continue;
        // `encodeURIComponent` leaves `!'()*` alone, which are legal in a path.
        entries.push(urlEntry(`${SITE_URL}/sermons/${encodeURIComponent(id)}`, lastmod, "monthly", "0.8"));
        sermonCount += 1;
      }
    }
  } catch (error) {
    // A missing or malformed sermons.json should not fail a deploy — the static
    // routes are still a valid sitemap.
    console.warn(`[sitemap] could not read sermons.json (${error.message}); writing static routes only.`);
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    "",
    entries.join("\n\n"),
    "",
    "</urlset>",
    "",
  ].join("\n");

  await writeFile(OUT_FILE, xml, "utf8");
  console.log(`[sitemap] ${entries.length} URLs written (${sermonCount} messages).`);
}

main().catch((error) => {
  // Never take a deploy down over the sitemap.
  console.error("[sitemap] generation failed, leaving the previous file in place:", error);
});
