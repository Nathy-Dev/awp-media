import { useEffect } from "react";

/**
 * Per-route document metadata.
 *
 * Every page of the old build carried the same `<title>` and description, which
 * is why search engines indexed nine near-identical entries. As a single-page
 * app there is no per-page `<head>` at all, so each route declares its own.
 */

const SITE_NAME = "Apostles of the Word and Prayer Worldwide";
const SITE_URL = "https://awpwmedia.org";
const DEFAULT_DESCRIPTION =
  "A fellowship where Christ is exalted, ministry training is prioritized, and prayer is a responsibility.";
const DEFAULT_IMAGE = `${SITE_URL}/images/thumbnail.png`;

export interface HeadOptions {
  /** Page-specific part of the title. The site name is appended. */
  title: string;
  description?: string;
  image?: string;
  /** Absolute path, used for the canonical URL and `og:url`. */
  path?: string;
  noindex?: boolean;
  /** `article` for sermon pages, so they get richer previews. */
  type?: "website" | "article";
}

/**
 * Create or update a `<meta>` tag. Tags we did not create are left alone, so
 * anything set in `index.html` is treated as the default rather than a
 * duplicate.
 */
function upsertMeta(attribute: "name" | "property", key: string, content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (element === null) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertLink(rel: string, href: string): void {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (element === null) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

export function useHead({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  path,
  noindex = false,
  type = "website",
}: HeadOptions): void {
  useEffect(() => {
    const fullTitle = title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`;
    const url = path === undefined ? SITE_URL : `${SITE_URL}${path}`;

    document.title = fullTitle;

    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");

    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", image);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image);

    if (path !== undefined) upsertLink("canonical", url);
  }, [title, description, image, path, noindex, type]);
}

export { SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION };
