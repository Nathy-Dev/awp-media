import { useCallback, useEffect, useRef, useState } from "react";

/** Key marking the throwaway history entry that backs the open drawer. */
const SENTINEL = "__awpDrawer";

export interface NavDrawerControls {
  open: boolean;
  /** Open the drawer and push a same-URL history entry behind it. */
  openDrawer: () => void;
  /**
   * Close without touching history. For in-drawer links, which use a replacing
   * navigation and therefore consume the sentry entry themselves.
   */
  dismiss: () => void;
  /** Close and pop the sentry entry. For the close button, scrim and Escape. */
  closeDrawer: () => void;
}

function hasSentinel(): boolean {
  const state: unknown = window.history.state;
  return typeof state === "object" && state !== null && SENTINEL in state;
}

/**
 * Mobile navigation drawer state.
 *
 * Opening pushes a throwaway same-URL history entry. The Android hardware back
 * button then pops that entry and fires `popstate` — which closes the drawer —
 * instead of navigating away from the site. On the old build the back button
 * left the page with the drawer still open.
 */
export function useNavDrawer(): NavDrawerControls {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);

  const openDrawer = useCallback(() => {
    if (openRef.current) return;
    openRef.current = true;
    setOpen(true);
    // The existing state is spread rather than replaced so React Router's own
    // bookkeeping (`idx`, `key`, `usr`) survives untouched.
    window.history.pushState({ ...window.history.state, [SENTINEL]: true }, "");
  }, []);

  const dismiss = useCallback(() => {
    openRef.current = false;
    setOpen(false);
  }, []);

  const closeDrawer = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    setOpen(false);
    if (hasSentinel()) window.history.back();
  }, []);

  // The back button (or a forward/back swipe on iOS) always wins.
  useEffect(() => {
    const onPopState = () => {
      openRef.current = false;
      setOpen(false);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closeDrawer]);

  // Stop the page behind the drawer from scrolling with it.
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, [open]);

  return { open, openDrawer, dismiss, closeDrawer };
}
