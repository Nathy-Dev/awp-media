import {
  isKnownCategory,
  type Sermon,
  type SermonCategory,
  type SermonTrack,
} from "../types/sermon";

const SERMONS_URL = "/sermons.json";

export const MESSAGES_PER_PAGE = 24;

/**
 * Categories that render their whole list at once. The old build also used this
 * list to decide which pages got pagination controls.
 */
export const UNPAGINATED_CATEGORIES: readonly SermonCategory[] = [
  "foundation",
  "discipleship",
  "workers",
];

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function parseTrack(raw: unknown): SermonTrack | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { label, file } = raw as { label?: unknown; file?: unknown };
  if (typeof file !== "string" || file.length === 0) return null;

  const fallbackLabel = file.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "Sermon";
  const trimmed = typeof label === "string" ? label.trim() : "";

  return { label: trimmed.length > 0 ? trimmed : fallbackLabel, file };
}

function parseSermon(raw: unknown, index: number): Sermon | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;

  const title = typeof record.title === "string" ? record.title.trim() : "";
  if (title.length === 0) return null;

  const tracks = Array.isArray(record.tracks)
    ? record.tracks.map(parseTrack).filter((track): track is SermonTrack => track !== null)
    : [];

  return {
    id: typeof record.id === "string" && record.id.length > 0 ? record.id : `sermon-${index}`,
    title,
    category: isKnownCategory(record.category) ? record.category : "general",
    image: typeof record.image === "string" ? record.image : "",
    tracks,
  };
}

async function fetchSermons(): Promise<Sermon[]> {
  const response = await fetch(SERMONS_URL, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Could not load ${SERMONS_URL} (${response.status})`);

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) throw new Error(`${SERMONS_URL} is not an array`);

  return payload
    .map(parseSermon)
    .filter((sermon): sermon is Sermon => sermon !== null);
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

let cache: Promise<Sermon[]> | null = null;

/**
 * Load the sermon index once per session.
 *
 * The old build fetched and re-parsed this 72KB file on every page load, and
 * twice on the detail page. Module-level memoisation costs one request total.
 */
export function loadSermons(): Promise<Sermon[]> {
  if (cache === null) {
    cache = fetchSermons().catch((error: unknown) => {
      cache = null; // Let the next caller retry rather than caching the failure.
      throw error;
    });
  }
  return cache;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export type CategoryFilter = SermonCategory | "all";

export function filterByCategory(sermons: Sermon[], category: CategoryFilter): Sermon[] {
  if (category === "all") return sermons;
  return sermons.filter((sermon) => sermon.category === category);
}

/**
 * Match a query against titles and track labels. The search box has always
 * advertised "search by title or year" but only ever matched the title.
 */
export function searchSermons(sermons: Sermon[], query: string): Sermon[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return sermons;

  return sermons.filter(
    (sermon) =>
      sermon.title.toLowerCase().includes(needle) ||
      sermon.tracks.some((track) => track.label.toLowerCase().includes(needle)),
  );
}

export interface Page<T> {
  items: T[];
  /** The requested page, clamped to the available range. */
  page: number;
  totalPages: number;
}

export function paginate<T>(items: T[], page: number, perPage = MESSAGES_PER_PAGE): Page<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(Math.max(1, Math.trunc(page) || 1), totalPages);
  const start = (safePage - 1) * perPage;

  return { items: items.slice(start, start + perPage), page: safePage, totalPages };
}

export function getSermonById(sermons: Sermon[], id: string): Sermon | undefined {
  return sermons.find((sermon) => sermon.id === id);
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

/**
 * Normalise the mix of path styles in `sermons.json` to root-relative URLs.
 * Local covers are stored as `../images/x.jpg`, which is what a page inside a
 * subdirectory needed; as a single-page app everything is root-relative.
 */
export function resolveImagePath(path: string): string {
  if (path.length === 0) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
    return path;
  }
  if (path.startsWith("../")) return path.slice(2);
  if (path.startsWith("./")) return `/${path.slice(2)}`;
  return `/${path}`;
}
