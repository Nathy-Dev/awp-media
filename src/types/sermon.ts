/** Shape of `public/sermons.json`, which the admin dashboard commits to GitHub. */

export const KNOWN_CATEGORIES = ["general", "foundation", "discipleship", "workers"] as const;

export type SermonCategory = (typeof KNOWN_CATEGORIES)[number];

export interface SermonTrack {
  /** Human-readable name. Used as the download filename, so it matters. */
  label: string;
  /** archive.org download URL for the audio file. */
  file: string;
}

export interface Sermon {
  id: string;
  title: string;
  category: SermonCategory;
  /** Remote archive.org URL, or a root-relative path under /images. */
  image: string;
  tracks: SermonTrack[];
}

export function isKnownCategory(value: unknown): value is SermonCategory {
  return typeof value === "string" && (KNOWN_CATEGORIES as readonly string[]).includes(value);
}
