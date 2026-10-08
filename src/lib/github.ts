import { withProxy } from "./config";
import type { Sermon } from "../types/sermon";

/**
 * GitHub Contents API client for `public/sermons.json`.
 *
 * Publishing commits straight to the repository, which triggers a Vercel
 * rebuild — so a saved message is live a minute or so later, and the build-time
 * image optimiser picks up any new cover art along the way.
 */

const API = "https://api.github.com";

/**
 * Base64 <-> UTF-8.
 *
 * `atob`/`btoa` are byte-oriented, so sermon titles containing `’`, `—` or an
 * accented name would be corrupted by using them directly. The escape/unescape
 * round-trip re-encodes through percent-encoding first. (`TextDecoder` would be
 * tidier but the encode direction still needs `TextEncoder` plus a chunked
 * `String.fromCharCode`, which is more code for the same result.)
 */
export function base64ToUtf8(base64: string): string {
  return decodeURIComponent(escape(window.atob(base64.replace(/\s/g, ""))));
}

export function utf8ToBase64(text: string): string {
  return window.btoa(unescape(encodeURIComponent(text)));
}

interface ContentsResponse {
  content: string;
  sha: string;
}

function contentsUrl(repo: string, path: string): string {
  return `${API}/repos/${repo}/contents/${path}`;
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };
}

async function readContents(repo: string, path: string, token: string, proxy: string): Promise<ContentsResponse> {
  const response = await fetch(withProxy(contentsUrl(repo, path), proxy), {
    headers: { ...authHeaders(token), "Cache-Control": "no-cache" },
  });

  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? `No file at ${path} in ${repo}. Check the repository and file path.`
        : `GitHub returned ${response.status} reading ${path}.`,
    );
  }

  return (await response.json()) as ContentsResponse;
}

/** Read and parse the sermon index as stored in the repository. */
export async function fetchMessages(config: {
  repo: string;
  path: string;
  token: string;
  proxy: string;
}): Promise<Sermon[]> {
  const data = await readContents(config.repo, config.path, config.token, config.proxy);
  const parsed: unknown = JSON.parse(base64ToUtf8(data.content));
  return Array.isArray(parsed) ? (parsed as Sermon[]) : [];
}

/**
 * Insert or replace one message and commit.
 *
 * The file's current `sha` is read immediately before the PUT, because the
 * Contents API rejects a write whose `sha` is stale. Two admins publishing at
 * the same moment will still conflict — the second gets a 409 and has to retry,
 * which is the correct outcome for a whole-file write.
 */
export async function saveMessage(
  entry: Sermon,
  config: { repo: string; path: string; token: string; proxy: string },
  updateId: string | null,
): Promise<void> {
  const current = await readContents(config.repo, config.path, config.token, config.proxy);
  const messages = JSON.parse(base64ToUtf8(current.content)) as Sermon[];

  const index = updateId === null ? -1 : messages.findIndex((message) => message.id === updateId);
  if (index === -1) messages.unshift(entry);
  else messages[index] = entry;

  const response = await fetch(withProxy(contentsUrl(config.repo, config.path), config.proxy), {
    method: "PUT",
    headers: { ...authHeaders(config.token), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `Admin: ${updateId === null ? "Added" : "Updated"} "${entry.title}"`,
      content: utf8ToBase64(JSON.stringify(messages, null, 2)),
      sha: current.sha,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("GitHub save failed:", response.status, detail);
    throw new Error(
      response.status === 409
        ? "Someone else saved a change first. Reload the page and try again."
        : `GitHub returned ${response.status} saving ${config.path}.`,
    );
  }
}

/** Verify the token can see the repository and file. Throws with a reason. */
export async function testConnection(config: {
  repo: string;
  path: string;
  token: string;
  proxy: string;
}): Promise<void> {
  await readContents(config.repo, config.path, config.token, config.proxy);
}
