import type { PublishStatus } from "./types";

const CLASSES: Record<PublishStatus["kind"], string> = {
  idle: "status-area",
  working: "status-area status-loading",
  success: "status-area status-success",
  error: "status-area status-error",
};

interface StatusPanelProps {
  status: PublishStatus;
}

/** Progress and outcome for the publish action. */
export function StatusPanel({ status }: StatusPanelProps) {
  // The idle state is the only one with no message of its own.
  const text = status.kind === "idle" ? "Ready..." : status.text;
  const percent = status.kind === "working" ? Math.round(status.percent) : 0;

  return (
    <div id="status-box" className={CLASSES[status.kind]}>
      <div className="progress-info">
        <span id="status-text">{text}</span>
        {status.kind === "working" && <span id="progress-percent">{percent}%</span>}
      </div>

      {status.kind === "working" && (
        <div id="progress-container">
          <div className="progress-bar">
            <div id="progress-fill" className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
