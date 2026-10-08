/** Full-page spinner. Shown while the route bundle or the sermon index loads. */
export function Loader() {
  return (
    <div id="loading-indicator">
      <div className="spinner" />
    </div>
  );
}

/**
 * Placeholder grid shown while `sermons.json` is in flight.
 *
 * The old build rendered nothing until the fetch resolved and then popped the
 * whole grid in at once. Reserving the card boxes keeps the page from jumping
 * when the real content arrives.
 */
export function SermonGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="sermon-list" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="sermon-card sermon-card--skeleton" key={index}>
          <div className="skeleton-block" />
          <div className="skeleton-line" />
        </div>
      ))}
    </div>
  );
}
