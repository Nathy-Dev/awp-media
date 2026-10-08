/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Cloudflare download Worker, without a trailing slash. */
  readonly VITE_DOWNLOAD_BASE?: string;
  /** archive.org item used when a track URL carries no item path. */
  readonly VITE_DEFAULT_ARCHIVE_ITEM?: string;
  /** Google Analytics measurement ID. Analytics is skipped when unset. */
  readonly VITE_GA_ID?: string;
  /** CORS proxy prefix used by the admin dashboard for GitHub/archive.org calls. */
  readonly VITE_CORS_PROXY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Optional file dropped into public/ to pre-seed admin credentials. */
interface Window {
  __LOCAL_CONFIG__?: Record<string, string | undefined>;
}
