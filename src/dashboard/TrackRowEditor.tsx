import { Icon } from "../components/Icon";
import type { TrackDraft } from "./types";

interface TrackRowEditorProps {
  track: TrackDraft;
  disabled: boolean;
  /** Existing tracks cannot be dropped while a message is being edited. */
  removable: boolean;
  onLabelChange: (key: string, label: string) => void;
  onFileChange: (key: string, file: File | null) => void;
  onMove: (key: string, direction: -1 | 1) => void;
  onRemove: (key: string) => void;
}

/**
 * One track row: reorder controls, a label, and the audio file picker.
 *
 * The old build addressed these by DOM id (`track-row-${n}`,
 * `label-track-${n}`) and mutated them with `innerHTML`; the row's identity was
 * a module counter rather than anything React tracked. Here each row is keyed
 * and its state lives in the parent.
 */
export function TrackRowEditor({
  track,
  disabled,
  removable,
  onLabelChange,
  onFileChange,
  onMove,
  onRemove,
}: TrackRowEditorProps) {
  const hasFile = track.file !== null;
  const isExisting = track.existingUrl !== null && !hasFile;
  const fileLabel = hasFile
    ? (track.file?.name ?? "")
    : isExisting
      ? "Existing Track (File Linked)"
      : "Select MP3";

  return (
    <div className="track-item">
      <div className="reorder-controls">
        <button
          type="button"
          className="reorder-btn"
          title="Move Up"
          aria-label="Move track up"
          disabled={disabled}
          onClick={() => onMove(track.key, -1)}
        >
          <Icon name="chevron-up" />
        </button>
        <button
          type="button"
          className="reorder-btn"
          title="Move Down"
          aria-label="Move track down"
          disabled={disabled}
          onClick={() => onMove(track.key, 1)}
        >
          <Icon name="chevron-down" />
        </button>
      </div>

      <div className="track-details">
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label style={{ fontSize: "0.75rem" }} htmlFor={`${track.key}-label`}>
            Track Label
          </label>
          <input
            id={`${track.key}-label`}
            type="text"
            className="track-label"
            value={track.label}
            placeholder="e.g. Part 1: The Intro"
            disabled={disabled}
            onChange={(event) => onLabelChange(track.key, event.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <div
            className="file-input-wrapper"
            style={{ padding: 15, borderRadius: 12, flexDirection: "row", justifyContent: "start" }}
          >
            <Icon name="music" className="track-file-icon" />
            <span
              className={`track-file-label${hasFile || isExisting ? " label-active" : ""}`}
              style={{ marginLeft: 10 }}
            >
              {fileLabel}
            </span>
            <input
              type="file"
              className="track-file"
              accept="audio/*"
              aria-label={`Audio file for ${track.label || "this track"}`}
              disabled={disabled}
              onChange={(event) => onFileChange(track.key, event.target.files?.[0] ?? null)}
            />
          </div>
        </div>
      </div>

      {removable ? (
        <button
          type="button"
          className="track-remove"
          title="Remove Track"
          aria-label={`Remove ${track.label || "this track"}`}
          disabled={disabled}
          onClick={() => onRemove(track.key)}
        >
          <Icon name="trash" />
        </button>
      ) : (
        <div style={{ width: 42 }} />
      )}
    </div>
  );
}
