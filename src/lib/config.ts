/**
 * Admin credential storage.
 *
 * Configuration lives in `localStorage` on the admin's own browser, seeded by an
 * optional `public/local-config.js` (gitignored) that sets
 * `window.__LOCAL_CONFIG__`. Nothing here is committed.
 */

export interface AdminConfig {
  iaAccess: string;
  iaSecret: string;
  token: string;
  repo: string;
  path: string;
  proxy: string;
  iaItem: string;
}

const STORAGE_KEYS = {
  iaAccess: "awpw_ia_access",
  iaSecret: "awpw_ia_secret",
  token: "awpw_github_token",
  repo: "awpw_gh_repo",
  path: "awpw_gh_path",
  proxy: "awpw_cors_proxy",
} as const;

const DEFAULTS = {
  repo: "Nathy-Dev/awp-media",
  path: "public/sermons.json",
  proxy: "https://cors-anywhere.herokuapp.com/",
  iaItem: "attitude5",
} as const;

/**
 * The sermon index moved from `sermons.json` at the repo root to
 * `public/sermons.json` when the site became a Vite build, so that it is still
 * served at the same `/sermons.json` URL.
 *
 * Admins who saved the old path have it in `localStorage`. Rewriting it here
 * means they never have to notice the move — a stale path would otherwise make
 * "Save" commit to a file the build no longer reads.
 */
function migratePath(path: string): string {
  return path === "sermons.json" ? DEFAULTS.path : path;
}

function localConfig(): Record<string, string | undefined> {
  return window.__LOCAL_CONFIG__ ?? {};
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Private browsing, or storage disabled — fall back to the defaults.
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Nothing useful to do; the value still works for this session.
  }
}

function pick(local: string | undefined, storedKey: string, fallback: string): string {
  if (typeof local === "string" && local.length > 0) return local;
  const stored = read(storedKey);
  return stored !== null && stored.length > 0 ? stored : fallback;
}

export function loadConfig(): AdminConfig {
  const local = localConfig();

  return {
    iaAccess: pick(local["IA_ACCESS"], STORAGE_KEYS.iaAccess, ""),
    iaSecret: pick(local["IA_SECRET"], STORAGE_KEYS.iaSecret, ""),
    token: pick(local["GITHUB_TOKEN"], STORAGE_KEYS.token, ""),
    repo: pick(local["GITHUB_REPO"], STORAGE_KEYS.repo, DEFAULTS.repo),
    path: migratePath(pick(local["GITHUB_PATH"], STORAGE_KEYS.path, DEFAULTS.path)),
    proxy: pick(local["CORS_PROXY"], STORAGE_KEYS.proxy, DEFAULTS.proxy),
    iaItem: local["DEFAULT_IA_ITEM"] ?? DEFAULTS.iaItem,
  };
}

/** Persist the credential fields. `iaItem` is deliberately session-only. */
export function saveConfig(config: AdminConfig): void {
  write(STORAGE_KEYS.iaAccess, config.iaAccess.trim());
  write(STORAGE_KEYS.iaSecret, config.iaSecret.trim());
  write(STORAGE_KEYS.token, config.token.trim());
  write(STORAGE_KEYS.repo, config.repo.trim());
  write(STORAGE_KEYS.path, migratePath(config.path.trim()));
  write(STORAGE_KEYS.proxy, config.proxy.trim());
}

// ---------------------------------------------------------------------------
// Magic setup link
// ---------------------------------------------------------------------------

/**
 * A URL that seeds another admin's browser with the same credentials.
 *
 * This is a convenience for sharing a working setup, not a secret-transfer
 * mechanism: the keys travel in the query string, so they land in the
 * recipient's browser history, and in any proxy or server log in between.
 */
export function buildMagicLink(config: AdminConfig): string {
  const params = new URLSearchParams({
    setup: "true",
    ia_access: config.iaAccess,
    ia_secret: config.iaSecret,
    gh_token: config.token,
    gh_repo: config.repo,
    gh_path: config.path,
    cors: config.proxy,
  });
  return `${window.location.origin}/dashboard?${params.toString()}`;
}

/** Apply a `?setup=true` link. Returns true when credentials were stored. */
export function applyMagicLink(search: string): boolean {
  const params = new URLSearchParams(search);
  if (params.get("setup") !== "true") return false;

  const mapping: Record<string, string> = {
    [STORAGE_KEYS.iaAccess]: params.get("ia_access") ?? "",
    [STORAGE_KEYS.iaSecret]: params.get("ia_secret") ?? "",
    [STORAGE_KEYS.token]: params.get("gh_token") ?? "",
    [STORAGE_KEYS.repo]: params.get("gh_repo") ?? "",
    [STORAGE_KEYS.path]: params.get("gh_path") ?? "",
    [STORAGE_KEYS.proxy]: params.get("cors") ?? "",
  };

  for (const [key, value] of Object.entries(mapping)) {
    if (value.length > 0) write(key, value);
  }

  return true;
}

/** Full request URL, routed through the configured CORS proxy when set. */
export function withProxy(rawUrl: string, proxy: string): string {
  if (proxy.length === 0) return rawUrl;

  // corsproxy.io style: the target is a query parameter.
  if (proxy.includes("?url=")) return proxy + encodeURIComponent(rawUrl);

  // cors-anywhere style: the target is appended as a path.
  return `${proxy.replace(/\/$/, "")}/${rawUrl.replace(/^\//, "")}`;
}
