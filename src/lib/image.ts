import { useEffect, useState } from "react";

/**
 * Optimised cover art, generated at build time by `scripts/optimize-images.mjs`.
 *
 * The shipped covers averaged ~350KB each (with five archive.org PNGs at
 * 1.8-2MB), loaded 24 to a page — about 8.4MB of images per homepage view. The
 * build emits WebP at three widths instead, which brings that under 500KB.
 *
 * The manifest is keyed by sermon id and carries ready-made `src`/`srcSet`
 * strings, so nothing outside the build script needs to know how filenames are
 * generated. Ids missing from the manifest fall back to the raw image URL.
 */
export interface CoverSource {
  src: string;
  srcSet: string;
  /** Intrinsic dimensions, used to reserve layout space and avoid CLS. */
  width: number;
  height: number;
}

type CoverManifest = Record<string, CoverSource>;

let manifestPromise: Promise<CoverManifest> | null = null;

function fetchManifest(): Promise<CoverManifest> {
  return fetch("/covers/manifest.json", { headers: { accept: "application/json" } })
    .then((response) => (response.ok ? (response.json() as Promise<CoverManifest>) : {}))
    .catch(() => ({}) as CoverManifest);
}

export function loadCoverManifest(): Promise<CoverManifest> {
  manifestPromise ??= fetchManifest();
  return manifestPromise;
}

/**
 * Cover variants for the current page.
 *
 * Returns `null` until the manifest has loaded — callers wait for it before
 * rendering the grid, because rendering a card without `width`/`height` is what
 * would reintroduce layout shift. An empty object means "loaded, and there are
 * no variants", which is a normal outcome in `npm run dev` before a build.
 */
export function useCoverManifest(): CoverManifest | null {
  const [manifest, setManifest] = useState<CoverManifest | null>(null);

  useEffect(() => {
    let active = true;
    void loadCoverManifest().then((loaded) => {
      if (active) setManifest(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  return manifest;
}
