import { Link } from "react-router-dom";
import { Icon } from "./Icon";

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Builds the href for a page, so the URL keeps the current query. */
  hrefFor: (page: number) => string;
  onChange: (page: number) => void;
}

/**
 * Page controls for the sermon grid.
 *
 * These are real links rather than the old `onclick` buttons: the target page is
 * reachable by middle-click and open-in-new-tab, and crawlers can follow it. The
 * `onChange` handler is what scrolls back to the top, which a bare link would
 * not do.
 */
export function Pagination({ page, totalPages, hrefFor, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const previous = page - 1;
  const next = page + 1;

  return (
    <nav className="pagination-container" aria-label="Message pages">
      {previous >= 1 ? (
        <Link className="pagination-btn" to={hrefFor(previous)} onClick={() => onChange(previous)}>
          <Icon name="chevron-left" />
          <span>Previous</span>
        </Link>
      ) : (
        <span className="pagination-btn" aria-disabled="true">
          <Icon name="chevron-left" />
          <span>Previous</span>
        </span>
      )}

      <div className="page-indicator" aria-live="polite">
        Page {page} of {totalPages}
      </div>

      {next <= totalPages ? (
        <Link className="pagination-btn" to={hrefFor(next)} onClick={() => onChange(next)}>
          <span>Next</span>
          <Icon name="chevron-right" />
        </Link>
      ) : (
        <span className="pagination-btn" aria-disabled="true">
          <span>Next</span>
          <Icon name="chevron-right" />
        </span>
      )}
    </nav>
  );
}
