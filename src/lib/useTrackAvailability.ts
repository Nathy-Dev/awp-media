import { useEffect, useState } from "react";
import { loadUnavailableTracks } from "./download";

/**
 * Track URLs known not to exist on archive.org.
 *
 * Returns an empty set until the manifest arrives — treating "not yet known" as
 * available, so a slow fetch never greys out a working download.
 */
export function useTrackAvailability(): Set<string> {
  const [unavailable, setUnavailable] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let active = true;
    void loadUnavailableTracks().then((loaded) => {
      if (active) setUnavailable(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  return unavailable;
}
