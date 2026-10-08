import { withProxy } from "./config";

/**
 * archive.org uploads.
 *
 * Files are PUT to the S3-like endpoint with the account's `LOW access:secret`
 * keys. Uploading also registers the item's cover art and audio, which the
 * Worker then serves to the public site.
 */

const S3_ENDPOINT = "https://s3.us.archive.org";

/**
 * The item name is the upload target, and `fileName` becomes part of the URL, so
 * both are sanitised before use. The old build stripped anything outside
 * `[a-zA-Z0-9.\-_]`, which is what produced the underscore-named files the
 * Worker has to resolve against their space-named siblings.
 */
function safeFileName(fileName: string): string {
  return fileName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9.\-_]/g, "");
}

export interface ArchiveUploadResult {
  /** The public download URL for the stored file. */
  url: string;
  /** The sanitised name the file was stored under. */
  storedName: string;
}

export async function uploadFile(
  file: File,
  itemName: string,
  access: string,
  secret: string,
  proxy: string,
): Promise<ArchiveUploadResult> {
  const storedName = safeFileName(file.name);
  const url = withProxy(`${S3_ENDPOINT}/${itemName}/${storedName}`, proxy);

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `LOW ${access}:${secret}`,
      "x-archive-auto-make-bucket": "1",
    },
    body: file,
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("archive.org upload failed:", response.status, detail);
    throw new Error(
      response.status === 403
        ? "archive.org rejected the keys. Check the Access and Secret key."
        : `archive.org returned ${response.status} uploading ${file.name}.`,
    );
  }

  return {
    url: `https://archive.org/download/${itemName}/${storedName}`,
    storedName,
  };
}

/**
 * Check credentials in both directions.
 *
 * Reading the metadata proves the keys resolve to a real item; the write is a
 * one-byte probe, because a read can succeed with keys that lack upload rights
 * on the bucket.
 */
export async function testConnection(config: {
  iaAccess: string;
  iaSecret: string;
  iaItem: string;
  proxy: string;
}): Promise<void> {
  const metadataUrl = withProxy(`https://archive.org/metadata/${config.iaItem}`, config.proxy);
  const read = await fetch(metadataUrl);

  if (!read.ok) throw new Error(`Could not read item “${config.iaItem}” (${read.status}).`);

  const metadata = (await read.json()) as { error?: string };
  if (typeof metadata.error === "string") throw new Error(metadata.error);

  const writeUrl = withProxy(`${S3_ENDPOINT}/${config.iaItem}/connection_test.txt`, config.proxy);
  const write = await fetch(writeUrl, {
    method: "PUT",
    headers: {
      Authorization: `LOW ${config.iaAccess}:${config.iaSecret}`,
      "x-archive-auto-make-bucket": "1",
    },
    body: "ping",
  });

  if (!write.ok) {
    console.error("archive.org write test failed:", write.status, await write.text());
    throw new Error(`Upload test failed (${write.status}). Check the Access and Secret key.`);
  }
}
