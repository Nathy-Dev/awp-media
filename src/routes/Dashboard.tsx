import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../styles/dashboard.css";
import { Icon } from "../components/Icon";
import { CredentialPanel } from "../dashboard/CredentialPanel";
import { MessageManager } from "../dashboard/MessageManager";
import { StatusPanel } from "../dashboard/StatusPanel";
import { TrackRowEditor } from "../dashboard/TrackRowEditor";
import { createTrackDraft, type MessageType, type PublishStatus, type TrackDraft } from "../dashboard/types";
import { applyMagicLink, loadConfig, type AdminConfig } from "../lib/config";
import { fetchMessages, saveMessage } from "../lib/github";
import { uploadFile } from "../lib/ia";
import { useHead } from "../lib/useHead";
import { isKnownCategory, type Sermon, type SermonCategory } from "../types/sermon";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "foundation", label: "Foundation School" },
  { value: "discipleship", label: "Discipleship" },
  { value: "workers", label: "Workers" },
] as const;

/** archive.org uploads go to the item named in the sample URL of a message. */
function itemFromUrl(url: string): string | null {
  return /archive\.org\/(?:download|details)\/([^/?#]+)/.exec(url)?.[1] ?? null;
}

export default function Dashboard() {
  useHead({
    title: "AWPW Control Center",
    description: "Publishing dashboard.",
    noindex: true,
  });

  const [, setSearchParams] = useSearchParams();

  const [config, setConfig] = useState<AdminConfig>(() => loadConfig());
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [notice, setNotice] = useState("Ready...");

  const [messageType, setMessageType] = useState<MessageType>("single");
  const [tracks, setTracks] = useState<TrackDraft[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<SermonCategory>("general");
  const [cover, setCover] = useState<File | null>(null);
  const [singleFile, setSingleFile] = useState<File | null>(null);

  const [editing, setEditing] = useState<Sermon | null>(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [messages, setMessages] = useState<Sermon[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [query, setQuery] = useState("");

  const [status, setStatus] = useState<PublishStatus>({ kind: "idle" });
  const submitting = status.kind === "working";

  // --- Magic setup link ----------------------------------------------------

  useEffect(() => {
    if (!applyMagicLink(window.location.search)) return;
    setConfig(loadConfig());
    setCredentialsOpen(true);
    setNotice("✨ Magic setup applied. Credentials saved to this browser.");
    // Drop the credentials out of the address bar and history.
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  // --- Title easter egg ----------------------------------------------------

  const titleClicks = useRef(0);
  const clickTimer = useRef<number | undefined>(undefined);

  const handleTitleClick = (): void => {
    titleClicks.current += 1;
    window.clearTimeout(clickTimer.current);

    if (titleClicks.current >= 5) {
      titleClicks.current = 0;
      setCredentialsOpen((open) => !open);
      return;
    }

    clickTimer.current = window.setTimeout(() => {
      titleClicks.current = 0;
    }, 1000);
  };

  useEffect(() => () => window.clearTimeout(clickTimer.current), []);

  // --- Tracks --------------------------------------------------------------

  useEffect(() => {
    // Always leave at least one row to fill in.
    setTracks((current) => (current.length === 0 ? [createTrackDraft()] : current));
  }, [messageType]);

  const patchTrack = useCallback((key: string, patch: Partial<TrackDraft>) => {
    setTracks((current) => current.map((track) => (track.key === key ? { ...track, ...patch } : track)));
  }, []);

  const moveTrack = useCallback((key: string, direction: -1 | 1) => {
    setTracks((current) => {
      const index = current.findIndex((track) => track.key === key);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= current.length) return current;

      const next = [...current];
      const [moved] = next.splice(index, 1);
      if (moved !== undefined) next.splice(target, 0, moved);
      return next;
    });
  }, []);

  const removeTrack = useCallback((key: string) => {
    setTracks((current) => {
      const next = current.filter((track) => track.key !== key);
      return next.length === 0 ? [createTrackDraft()] : next;
    });
  }, []);

  // --- Message manager -----------------------------------------------------

  const refreshMessages = useCallback(async () => {
    if (config.token.length === 0 || config.repo.length === 0) {
      setNotice("Add a GitHub token and repository first.");
      return;
    }

    setMessagesLoading(true);
    try {
      setMessages(await fetchMessages(config));
    } catch (error) {
      setNotice(`❌ ${(error as Error).message}`);
    } finally {
      setMessagesLoading(false);
    }
  }, [config]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) return [];
    return messages.filter((message) => message.title.toLowerCase().includes(needle)).slice(0, 10);
  }, [messages, query]);

  const loadForEdit = (message: Sermon): void => {
    setEditing(message);
    setTitle(message.title);
    setCategory(message.category);

    const item = itemFromUrl(message.image) ?? itemFromUrl(message.tracks[0]?.file ?? "");
    if (item !== null) setConfig((current) => ({ ...current, iaItem: item }));

    setMessageType("series");
    setTracks(message.tracks.map((track) => createTrackDraft(track)));
    setManagerOpen(false);
    setCover(null);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const cancelEdit = (): void => {
    setEditing(null);
    setTitle("");
    setTracks([createTrackDraft()]);
    setCover(null);
    setSingleFile(null);
  };

  // --- Publish -------------------------------------------------------------

  const handleSubmit = async (): Promise<void> => {
    const trimmedTitle = title.trim();

    if (trimmedTitle.length === 0 || config.iaItem.length === 0) {
      setStatus({ kind: "error", text: "❌ A title is required." });
      return;
    }

    // Work out what is being kept, and what still needs uploading.
    const plan: { label: string; file: string }[] = [];
    const uploads: { file: File; label: string }[] = [];

    if (messageType === "single") {
      if (singleFile !== null) {
        uploads.push({ file: singleFile, label: trimmedTitle });
      } else if (editing?.tracks[0] !== undefined) {
        plan.push({ label: trimmedTitle, file: editing.tracks[0].file });
      }
    } else {
      for (const track of tracks) {
        if (track.file !== null) uploads.push({ file: track.file, label: track.label });
        else if (track.existingUrl !== null) plan.push({ label: track.label, file: track.existingUrl });
      }
    }

    if (plan.length === 0 && uploads.length === 0) {
      setStatus({ kind: "error", text: "❌ No tracks to publish." });
      return;
    }

    const setProgress = (percent: number, text: string): void =>
      setStatus({ kind: "working", percent, text });

    setProgress(5, "Preparing…");

    try {
      // 1. Cover art — reused from the message being edited when none is chosen.
      let coverUrl: string;
      if (cover !== null) {
        setProgress(10, "Uploading cover art…");
        coverUrl = (await uploadFile(cover, config.iaItem, config.iaAccess, config.iaSecret, config.proxy)).url;
      } else if (editing !== null) {
        coverUrl = editing.image;
      } else {
        throw new Error("A cover image is required for a new message.");
      }

      // 2. New audio.
      for (const [index, upload] of uploads.entries()) {
        setProgress(15 + (index / uploads.length) * 70, `Uploading ${upload.label || upload.file.name}…`);
        const result = await uploadFile(
          upload.file,
          config.iaItem,
          config.iaAccess,
          config.iaSecret,
          config.proxy,
        );
        plan.push({ label: upload.label || result.storedName, file: result.url });
      }

      // 3. Commit to the repository.
      setProgress(90, "Updating the database…");
      const entry: Sermon = {
        id: editing?.id ?? `${config.iaItem}-${Date.now()}`,
        title: trimmedTitle,
        category,
        image: coverUrl,
        tracks: plan,
      };

      await saveMessage(entry, config, editing?.id ?? null);

      setStatus({ kind: "success", text: "✨ Message saved. The site rebuilds in a minute or two." });
      setNotice("✨ Message published.");
      cancelEdit();
      if (managerOpen) void refreshMessages();
    } catch (error) {
      console.error(error);
      setStatus({ kind: "error", text: `❌ ${(error as Error).message}` });
    }
  };

  // --- Render --------------------------------------------------------------

  return (
    <div className="dashboard-container">
      <div className="glass-card">
        <h1
          onClick={handleTitleClick}
          style={{ cursor: "pointer", userSelect: "none" }}
          title="AWPW Control Center"
        >
          AWPW Control Center
        </h1>

        {credentialsOpen && (
          <CredentialPanel
            config={config}
            onChange={(patch) => setConfig((current) => ({ ...current, ...patch }))}
            onNotify={setNotice}
          />
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div className="section-title" style={{ margin: 0, border: "none", padding: 0 }}>
            Publish Content
          </div>
          <button
            type="button"
            className="btn-add-track"
            style={{ margin: 0, padding: "8px 15px", fontSize: "0.85rem", width: "auto" }}
            aria-expanded={managerOpen}
            onClick={() => {
              const next = !managerOpen;
              setManagerOpen(next);
              if (next && messages.length === 0) void refreshMessages();
            }}
          >
            <Icon name="edit" /> Manage Existing
          </button>
        </div>

        {managerOpen && (
          <MessageManager
            query={query}
            onQueryChange={setQuery}
            results={results}
            loading={messagesLoading}
            onRefresh={() => void refreshMessages()}
            onSelect={loadForEdit}
          />
        )}

        {editing !== null && (
          <div
            id="edit-badge"
            style={{
              background: "var(--accent)",
              color: "white",
              padding: "8px 15px",
              borderRadius: 100,
              fontSize: "0.8rem",
              fontWeight: 700,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "fit-content",
            }}
          >
            <Icon name="edit" /> Editing: <span>{editing.title}</span>
            <button
              type="button"
              className="track-remove"
              style={{ padding: 0, marginLeft: 4 }}
              aria-label="Stop editing"
              onClick={cancelEdit}
            >
              <Icon name="close" />
            </button>
          </div>
        )}

        <div className="type-toggle">
          {(["single", "series"] as const).map((type) => (
            <button
              key={type}
              type="button"
              className={`toggle-option${messageType === type ? " active" : ""}`}
              aria-pressed={messageType === type}
              onClick={() => setMessageType(type)}
            >
              {type === "single" ? "Single Message" : "Message Series"}
            </button>
          ))}
        </div>

        <div className="section-title">
          <Icon name="info" /> Basic Info
        </div>

        <div className="form-group">
          <label htmlFor="msg-title">Main Title</label>
          <input
            id="msg-title"
            type="text"
            placeholder="e.g. The Believer's Glow"
            value={title}
            disabled={submitting}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="msg-category">Category</label>
          <select
            id="msg-category"
            value={category}
            disabled={submitting}
            onChange={(event) => {
              const value = event.target.value;
              if (isKnownCategory(value)) setCategory(value);
            }}
          >
            {CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="section-title">
          <Icon name="image" /> Media Assets
        </div>

        <div className="form-group">
          <label htmlFor="msg-cover">Cover Art (Shared for all tracks)</label>
          <div className="file-input-wrapper">
            <Icon name="cloud-upload" className="file-icon" />
            <span className="track-file-label label-active">
              {cover?.name ?? (editing !== null ? "Keeping the existing cover" : "Click or drag a Cover Image")}
            </span>
            <input
              id="msg-cover"
              type="file"
              accept="image/*"
              disabled={submitting}
              onChange={(event) => setCover(event.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        {messageType === "single" ? (
          <div className="form-group">
            <label htmlFor="msg-file">Audio File (MP3)</label>
            <div className="file-input-wrapper">
              <Icon name="music" className="file-icon" />
              <span className="track-file-label label-active">
                {singleFile?.name ??
                  (editing?.tracks[0] !== undefined
                    ? "Keeping the existing recording"
                    : "Select the Message Audio")}
              </span>
              <input
                id="msg-file"
                type="file"
                accept="audio/*"
                disabled={submitting}
                onChange={(event) => setSingleFile(event.target.files?.[0] ?? null)}
              />
            </div>
          </div>
        ) : (
          <>
            <label>Series Tracks</label>
            <div className="tracks-container">
              {tracks.map((track) => (
                <TrackRowEditor
                  key={track.key}
                  track={track}
                  disabled={submitting}
                  // Existing tracks are kept while editing, so a loaded message
                  // cannot be accidentally emptied of its older recordings.
                  removable={!(track.existingUrl !== null && editing !== null)}
                  onLabelChange={(key, label) => patchTrack(key, { label })}
                  onFileChange={(key, file) => patchTrack(key, { file })}
                  onMove={moveTrack}
                  onRemove={removeTrack}
                />
              ))}
            </div>

            <button
              type="button"
              className="btn-add-track"
              disabled={submitting}
              onClick={() => setTracks((current) => [...current, createTrackDraft()])}
            >
              <Icon name="plus" /> Add Another Track
            </button>
          </>
        )}

        <button type="button" className="btn-primary" disabled={submitting} onClick={() => void handleSubmit()}>
          <Icon name="rocket" /> {editing !== null ? "Update Message" : "Publish Message"}
        </button>

        <StatusPanel status={status} />
        {status.kind === "idle" && notice !== "Ready..." && <p className="muted-note">{notice}</p>}
      </div>

      <footer>
        <Link to="/">← Back to Public Website</Link>
      </footer>
    </div>
  );
}
