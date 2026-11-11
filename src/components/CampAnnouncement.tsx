import { useState, useEffect, useRef, useCallback } from "react";
import "./CampAnnouncement.css";

const SESSION_KEY = "gifts_of_the_spirit2026_announced";

export function CampAnnouncement() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const dismiss = useCallback(() => {
    setClosing(true);
    sessionStorage.setItem(SESSION_KEY, "1");
  }, []);

  useEffect(() => {
    // Don't show again if already dismissed this session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // Small delay so the page has time to render before overlay appears
    const timer = setTimeout(() => setVisible(true), 700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus({ preventScroll: true });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
      }
      if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, [visible, dismiss]);

  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => setVisible(false), 380);
    return () => clearTimeout(timer);
  }, [closing]);

  if (!visible) return null;

  return (
    <div
      className={`ca-backdrop${closing ? " ca-closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="The Gifts of the Spirit announcement"
      onClick={(e) => {
        // Close when clicking the dark backdrop, not the card itself
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div className="ca-card">
        <button
          id="ca-close-btn"
          ref={closeButtonRef}
          className="ca-close"
          onClick={dismiss}
          aria-label="Close announcement"
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <img
          src="/images/gifts-of-the-spirit-2026.webp"
          alt="The Gifts of the Spirit with Pastor Daniel Usoroh and Pastor Toluwani Kehinde. 24 November 2026, 5:30 pm–9:00 pm, King David Road, beside SP School, Pipeline, Rumuokwurusi."
          className="ca-flyer"
          width={736}
          height={920}
          loading="eager"
        />
      </div>
    </div>
  );
}
