interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Filter box for the sermon grid.
 *
 * The old build read this input in two places through a global `searchInput`
 * element and re-rendered by mutating `innerHTML`; the handler was wired up as
 * `onkeyup="filterSermons()"` on one page, and `filterSermons` was never
 * defined — so every keystroke threw. Here it is a controlled input.
 */
export function SearchBox({ value, onChange }: SearchBoxProps) {
  return (
    <input
      type="search"
      className="search-box"
      placeholder="Search by title or year..."
      aria-label="Search messages"
      autoComplete="off"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
