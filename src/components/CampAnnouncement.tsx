import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./CampAnnouncement.css";

const SESSION_KEY = "bpaw2026_announced";

/**
 * Full-screen announcement modal that reveals the BPAW Camp Meeting 2026 flyer
 * on the first home-page visit per browser session.
 *
 * - Fades in after a short delay so it doesn't clash with page paint.
 * - Remembers dismissal in sessionStorage (reappears on a new tab/session).
 * - "Register Now" links directly to the registration form at /bpaw.
 */
export function CampAnnouncement() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Don't show again if already dismissed this session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // Small delay so the page has time to render before overlay appears
    const timer = setTimeout(() => setVisible(true), 700);
    return () => clearTimeout(timer);
  }, []);

  // Lock body scroll while modal is mounted and visible
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [visible]);

  const dismiss = () => {
    setClosing(true);
    sessionStorage.setItem(SESSION_KEY, "1");
    // Wait for the close animation before unmounting
    setTimeout(() => setVisible(false), 380);
  };

  if (!visible) return null;

  return (
    <div
      className={`ca-backdrop${closing ? " ca-closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="BPAW Camp Meeting 2026 Announcement"
      onClick={(e) => {
        // Close when clicking the dark backdrop, not the card itself
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div className="ca-card">
        {/* Close button */}
        <button
          id="ca-close-btn"
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

        {/* Flyer image */}
        <div className="ca-flyer-wrap">
          <img
            src="/images/bpaw-flyer-2026.jpeg"
            alt="BPAW Camp Meeting 2026 — 31st October, Port Harcourt"
            className="ca-flyer"
            loading="eager"
          />
        </div>

        {/* CTA strip */}
        <div className="ca-footer">
          <p className="ca-tagline">Seats are filling up — secure your spot today!</p>
          <div className="ca-actions">
            <Link
              id="ca-register-btn"
              to="/bpaw"
              className="ca-btn-primary"
              onClick={dismiss}
            >
              Register Now
            </Link>
            <button
              id="ca-dismiss-btn"
              type="button"
              className="ca-btn-ghost"
              onClick={dismiss}
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
