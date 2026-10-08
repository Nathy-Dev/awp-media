import { useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Pagination } from "./Pagination";
import { SearchBox } from "./SearchBox";
import { SermonCard } from "./SermonCard";
import { SermonGridSkeleton } from "./Loader";
import { useCoverManifest } from "../lib/image";
import { useSermons } from "../lib/useSermons";
import {
  filterByCategory,
  MESSAGES_PER_PAGE,
  paginate,
  searchSermons,
  type CategoryFilter,
} from "../lib/sermons";

interface SermonBrowserProps {
  category: CategoryFilter;
  /** Show the search field above the grid. */
  showSearch?: boolean;
  /** Shown when a search matches nothing. */
  emptyMessage?: string;
}

/**
 * The searchable, paginated sermon grid shared by every listing page.
 *
 * Both the query and the page live in the URL, so a filtered view is
 * shareable and the back button steps through it. The old build kept the page
 * in the URL but the search term in a DOM node, so a search was lost on reload.
 */
export function SermonBrowser({
  category,
  showSearch = true,
  emptyMessage = "Click On A Message To Download",
}: SermonBrowserProps) {
  const state = useSermons();
  const covers = useCoverManifest();
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();

  const query = params.get("q") ?? "";
  const requestedPage = Number.parseInt(params.get("page") ?? "1", 10) || 1;

  const { sermons, page, totalPages, total } = useMemo(() => {
    if (state.status !== "ready") {
      return { sermons: [], page: 1, totalPages: 1, total: 0 };
    }

    const matches = searchSermons(filterByCategory(state.sermons, category), query);
    const paged = paginate(matches, requestedPage);
    return {
      sermons: paged.items,
      page: paged.page,
      totalPages: paged.totalPages,
      total: matches.length,
    };
  }, [state, category, query, requestedPage]);

  const setQuery = (value: string): void => {
    const next = new URLSearchParams(params);
    if (value.length > 0) next.set("q", value);
    else next.delete("q");
    // A new search starts from the first page, and replacing rather than
    // pushing keeps typing from filling up the history stack.
    next.delete("page");
    setParams(next, { replace: true });
  };

  const hrefFor = (target: number): string => {
    const next = new URLSearchParams(params);
    next.set("page", String(target));
    return `${pathname}?${next.toString()}`;
  };

  // Hold the grid back until the cover manifest has loaded: a card rendered
  // without its `width`/`height` would shift every card below it once the image
  // arrived, which is exactly the instability this rewrite is meant to remove.
  const ready = state.status === "ready" && covers !== null;

  return (
    <>
      {showSearch && <SearchBox value={query} onChange={setQuery} />}

      {!ready && state.status !== "error" && <SermonGridSkeleton />}

      {state.status === "error" && (
        <p className="grid-message" role="alert">
          {state.message}
        </p>
      )}

      {ready && total === 0 && (
        <p className="grid-message">
          {query.length > 0
            ? `No messages match “${query}”.`
            : emptyMessage}
        </p>
      )}

      {ready && total > 0 && (
        <>
          <div className="sermon-list">
            {sermons.map((sermon) => (
              <SermonCard key={sermon.id} sermon={sermon} cover={covers?.[sermon.id]} />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            hrefFor={hrefFor}
            onChange={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          />

          {total > MESSAGES_PER_PAGE && (
            <p className="results-count">
              {total} messages
              {query.length > 0 ? ` matching “${query}”` : ""}
            </p>
          )}
        </>
      )}
    </>
  );
}
