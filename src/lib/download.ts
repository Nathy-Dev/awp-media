import type { SermonTrack } from "../types/sermon";

/**
 * Base URL of the Cloudflare Worker in `cloudflare-worker/`, no trailing slash.
 * Unset in local development unless you add it to `.env.local`.
 */
const DOWNLOAD_BASE = (import.meta.env.VITE_DOWNLOAD_BASE ?? "").replace(/\/+$/, "");

/** archive.org item used when a track URL carries no item path. */
export const DEFAULT_ARCHIVE_ITEM = import.meta.env.VITE_DEFAULT_ARCHIVE_ITEM ?? "attitude5";

export interface ArchiveRef {
  item: string;
  file: string;
}

/**
 * Split an archive.org download URL into its item and filename.
 *
 * Mirrors the regex the admin dashboard already relied on for the same job.
 * `decodeURIComponent` can throw on malformed input, so the parse is guarded.
 */
export function parseArchiveUrl(fileUrl: string): ArchiveRef | null {
  const match = /archive\.org\/(?:download|details)\/([^/?#]+)\/([^?#]+)/.exec(fileUrl);
  const item = match?.[1];
  const file = match?.[2];
  if (item === undefined || file === undefined) return null;

  try {
    return { item: decodeURIComponent(item), file: decodeURIComponent(file) };
  } catch {
    return null;
  }
}

export function isDownloadProxyConfigured(): boolean {
  return DOWNLOAD_BASE.length > 0;
}

/**
 * The URL a download button should point at.
 *
 * Routed through the Worker when configured, because that is what supplies the
 * `Content-Disposition` header — without it iOS Safari opens a player instead of
 * saving the file. Falls back to the raw archive.org URL so the site still works
 * before the Worker is deployed, and for any non-archive.org track.
 */
export function buildDownloadUrl(track: SermonTrack): string {
  const ref = parseArchiveUrl(track.file);
  if (ref === null || DOWNLOAD_BASE.length === 0) return track.file;

  const params = new URLSearchParams({
    item: ref.item,
    file: ref.file,
    label: track.label,
  });
  return `${DOWNLOAD_BASE}/download?${params.toString()}`;
}

/**
 * Cover art through the Worker. Used as the fallback `<img>` source: the
 * `/download/` route on archive.org 500s for this item, so a raw URL is not a
 * dependable fallback, but the Worker resolves the real node.
 */
export function buildArchiveImageUrl(imageUrl: string): string {
  const ref = parseArchiveUrl(imageUrl);
  if (ref === null || DOWNLOAD_BASE.length === 0) return imageUrl;

  const params = new URLSearchParams({ item: ref.item, file: ref.file });
  return `${DOWNLOAD_BASE}/img?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

interface TrackAvailability {
  generatedAt: string;
  unavailable: string[];
}

let availability: Promise<Set<string>> | null = null;

/**
 * Track URLs that do not exist on archive.org.
 *
 * Five entries in `sermons.json` reference files that were never uploaded
 * (Pillars of Truth 8-10, My Major Assignment 7-8). Asking the Worker and
 * getting a 404 back is a poor experience, so the build resolves availability
 * up front and the UI greys those rows out.
 *
 * Absence of the file is not an error: the site works fine without it.
 */
export function loadUnavailableTracks(): Promise<Set<string>> {
  availability ??= fetch("/track-availability.json", { headers: { accept: "application/json" } })
    .then((response) => (response.ok ? response.json() : null))
    .then((data: TrackAvailability | null) =>
      new Set(Array.isArray(data?.unavailable) ? data.unavailable : []),
    )
    .catch(() => new Set<string>());

  return availability;
}
