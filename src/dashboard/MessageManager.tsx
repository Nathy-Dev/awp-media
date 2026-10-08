import { Icon } from "../components/Icon";
import type { Sermon } from "../types/sermon";

interface MessageManagerProps {
  query: string;
  onQueryChange: (value: string) => void;
  results: Sermon[];
  loading: boolean;
  onRefresh: () => void;
  onSelect: (message: Sermon) => void;
}

/**
 * Search and load an already-published message back into the form.
 *
 * The list comes from the repository rather than the public
 * `/sermons.json`, so an admin sees their unpublished-on-the-live-site edits too.
 */
export function MessageManager({
  query,
  onQueryChange,
  results,
  loading,
  onRefresh,
  onSelect,
}: MessageManagerProps) {
  return (
    <div
      id="manager-section"
      style={{
        background: "rgba(0,0,0,0.2)",
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        border: "1px solid var(--border)",
      }}
    >
      <div className="form-group" style={{ marginBottom: 15 }}>
        <label htmlFor="search-input">Search Existing Messages</label>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            id="search-input"
            type="text"
            placeholder="Type title to search..."
            autoComplete="off"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <button
            type="button"
            className="btn-primary"
            style={{ margin: 0, width: "auto", padding: "0 15px", fontSize: "0.8rem" }}
            aria-label="Reload messages from GitHub"
            disabled={loading}
            onClick={onRefresh}
          >
            <Icon name="sync" />
          </button>
        </div>
      </div>

      <div
        id="search-results"
        style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5 }}
      >
        {loading && <p className="muted-note">Loading messages…</p>}

        {!loading && query.length > 0 && results.length === 0 && (
          <p className="muted-note">No message matches “{query}”.</p>
        )}

        {results.map((message) => (
          <button
            key={message.id}
            type="button"
            className="search-result-item"
            onClick={() => onSelect(message)}
          >
            <span>{message.title}</span>{" "}
            <span className="search-result-category">{message.category}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
