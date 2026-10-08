/** A track being edited in the dashboard, before it is committed. */
export interface TrackDraft {
  /** Stable React key; not part of the saved data. */
  key: string;
  label: string;
  /** Newly chosen file, or null when reusing an existing upload. */
  file: File | null;
  /** URL of an already-published file, or null for a new track. */
  existingUrl: string | null;
}

let counter = 0;

export function createTrackDraft(seed?: { label: string; file: string }): TrackDraft {
  counter += 1;
  return {
    key: `track-${counter}`,
    label: seed?.label ?? "",
    file: null,
    existingUrl: seed?.file ?? null,
  };
}

/** Working state for the publish form. */
export type MessageType = "single" | "series";

export type PublishStatus =
  | { kind: "idle" }
  | { kind: "working"; text: string; percent: number }
  | { kind: "success"; text: string }
  | { kind: "error"; text: string };
