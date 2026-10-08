import { Icon } from "./Icon";
import { buildDownloadUrl, isDownloadProxyConfigured } from "../lib/download";
import type { SermonTrack } from "../types/sermon";

let warned = false;

/**
 * One-time console notice when the download Worker is not configured.
 *
 * Without `VITE_DOWNLOAD_BASE` the buttons fall back to the raw archive.org URL,
 * which answers 500 for every file in this library — so a silent fallback would
 * look like a working link that never downloads anything.
 */
function warnIfUnconfigured(): void {
  if (warned || isDownloadProxyConfigured()) return;
  warned = true;
  console.warn(
    "[awp] VITE_DOWNLOAD_BASE is not set — download links point straight at archive.org, " +
      "which returns 500 for this item. Deploy cloudflare-worker/ and set the env var.",
  );
}

interface DownloadButtonProps {
  track: SermonTrack;
}

/** Icon link that downloads a single track. */
export function DownloadButton({ track }: DownloadButtonProps) {
  warnIfUnconfigured();

  return (
    <a
      className="track-download"
      href={buildDownloadUrl(track)}
      aria-label={`Download ${track.label}`}
      title={`Download ${track.label}`}
    >
      <Icon name="download" size={24} />
    </a>
  );
}

interface TrackRowProps {
  track: SermonTrack;
  /**
   * The file is known not to exist on archive.org — five entries in
   * `sermons.json` reference tracks that were never uploaded. Rendered as a
   * disabled row rather than a link that 404s.
   */
  unavailable?: boolean;
}

export function TrackRow({ track, unavailable = false }: TrackRowProps) {
  if (unavailable) {
    return (
      <p className="track-unavailable">
        <span className="track-label">{track.label}</span>
        <span className="track-status">Unavailable</span>
      </p>
    );
  }

  return (
    <p>
      <span className="track-label">{track.label}</span>
      <DownloadButton track={track} />
    </p>
  );
}
