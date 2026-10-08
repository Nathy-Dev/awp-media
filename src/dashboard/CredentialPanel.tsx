import { useState } from "react";
import { Icon } from "../components/Icon";
import { buildMagicLink, saveConfig, type AdminConfig } from "../lib/config";
import { testConnection as testGitHub } from "../lib/github";
import { testConnection as testArchive } from "../lib/ia";

interface CredentialPanelProps {
  config: AdminConfig;
  onChange: (patch: Partial<AdminConfig>) => void;
  onNotify: (message: string) => void;
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  type?: "text" | "password";
  placeholder?: string;
  onChange: (value: string) => void;
}

function Field({ id, label, value, type = "text", placeholder, onChange }: FieldProps) {
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

/**
 * Credentials, hidden behind five clicks on the page title.
 *
 * The keys are stored in this browser's `localStorage` and nowhere else. The
 * "Magic Link" copies a URL carrying them in its query string so a second admin
 * can seed their own browser — convenient, but the keys then sit in whatever
 * chat app or inbox the link travelled through.
 */
export function CredentialPanel({ config, onChange, onNotify }: CredentialPanelProps) {
  const [busy, setBusy] = useState<"github" | "archive" | null>(null);

  const runGitHubTest = async (): Promise<void> => {
    setBusy("github");
    try {
      await testGitHub(config);
      onNotify("✅ GitHub connection successful.");
    } catch (error) {
      onNotify(`❌ GitHub connection failed: ${(error as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const runArchiveTest = async (): Promise<void> => {
    setBusy("archive");
    try {
      await testArchive(config);
      onNotify("✅ archive.org connection successful (read and write).");
    } catch (error) {
      onNotify(`❌ archive.org connection failed: ${(error as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      id="credential-section"
      style={{ borderBottom: "2px solid var(--border)", marginBottom: 30, paddingBottom: 10 }}
    >
      <Field
        id="ia-access"
        label="Internet Archive Access Key"
        value={config.iaAccess}
        type="password"
        placeholder="Your IA Access Key"
        onChange={(value) => onChange({ iaAccess: value })}
      />
      <Field
        id="ia-secret"
        label="Internet Archive Secret Key"
        value={config.iaSecret}
        type="password"
        placeholder="Your IA Secret Key"
        onChange={(value) => onChange({ iaSecret: value })}
      />
      <Field
        id="cors-proxy"
        label="CORS Proxy URL"
        value={config.proxy}
        placeholder="https://cors-anywhere.herokuapp.com/"
        onChange={(value) => onChange({ proxy: value })}
      />
      <Field
        id="github-token"
        label="GitHub PAT Token"
        value={config.token}
        type="password"
        placeholder="ghp_..."
        onChange={(value) => onChange({ token: value })}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
        <Field
          id="github-repo"
          label="GitHub Repo"
          value={config.repo}
          placeholder="username/repo"
          onChange={(value) => onChange({ repo: value })}
        />
        <Field
          id="github-path"
          label="File Path"
          value={config.path}
          placeholder="public/sermons.json"
          onChange={(value) => onChange({ path: value })}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20 }}>
        <button
          type="button"
          className="btn-primary"
          style={{ background: "var(--success)", margin: 0, fontSize: "0.8rem", width: "auto" }}
          onClick={() => {
            saveConfig(config);
            onNotify("✨ Credentials saved to this browser.");
          }}
        >
          <Icon name="save" /> Save Config
        </button>

        <button
          type="button"
          className="btn-primary"
          style={{ background: "var(--accent)", margin: 0, fontSize: "0.8rem", width: "auto" }}
          onClick={() => {
            void navigator.clipboard.writeText(buildMagicLink(config)).then(
              () => onNotify("✨ Magic setup link copied. Share it privately with other admins."),
              () => onNotify("❌ Could not copy — your browser blocked clipboard access."),
            );
          }}
        >
          <Icon name="magic" /> Magic Link
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
        <button
          type="button"
          className="btn-primary"
          style={{ background: "#444", margin: 0, fontSize: "0.7rem", width: "auto" }}
          disabled={busy !== null}
          onClick={() => void runGitHubTest()}
        >
          <Icon name="github" /> {busy === "github" ? "Testing…" : "Test GitHub"}
        </button>

        <button
          type="button"
          className="btn-primary"
          style={{ background: "#444", margin: 0, fontSize: "0.7rem", width: "auto" }}
          disabled={busy !== null}
          onClick={() => void runArchiveTest()}
        >
          <Icon name="cloud" /> {busy === "archive" ? "Testing…" : "Test Archive"}
        </button>
      </div>

      <p className="muted-note">
        <b>Save Config</b> keeps these keys in this browser only. <b>Magic Link</b> copies a setup URL
        for another admin — treat that link as a password.
      </p>
    </div>
  );
}
