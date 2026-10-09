import { Link } from "react-router-dom";
import { FolderLinks } from "../components/FolderLinks";
import { SermonBrowser } from "../components/SermonBrowser";
import { useHead } from "../lib/useHead";
import { CampAnnouncement } from "../components/CampAnnouncement";

export default function Home() {
  useHead({
    title: "Apostles of the Word and Prayer Worldwide",
    path: "/",
  });

  return (
    <>
      <CampAnnouncement />

      <main className="sermons-section container" style={{ padding: "1.5rem 0" }}>

        {/* ── Camp registration notice ── */}
        <Link
          to="/bpaw"
          id="camp-notice-banner"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            background: "linear-gradient(135deg, #FDF3DC 0%, #FEF8ED 100%)",
            border: "1.5px solid #D4A832",
            borderRadius: "10px",
            padding: "0.75rem 1rem",
            marginBottom: "1.5rem",
            textDecoration: "none",
            color: "#7A5210",
            fontSize: "0.88rem",
            fontWeight: 500,
            lineHeight: 1.45,
            transition: "box-shadow 0.2s ease, transform 0.2s ease",
            boxShadow: "0 2px 8px rgba(212, 168, 50, 0.18)",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 16px rgba(212, 168, 50, 0.32)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 2px 8px rgba(212, 168, 50, 0.18)";
          }}
        >
          {/* Pulsing dot */}
          <span style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: "#D4A832",
            flexShrink: 0,
            boxShadow: "0 0 0 0 rgba(212, 168, 50, 0.6)",
            animation: "camp-notice-pulse 1.8s ease-in-out infinite",
          }} />
          <span>
            <strong style={{ color: "#5C3A08" }}>BPAW Camp Meeting 2026</strong>
            {" "}— Registration is open! Click here to register before the day.
          </span>
          <span style={{ marginLeft: "auto", fontSize: "1rem", color: "#D4A832", flexShrink: 0 }}>→</span>
        </Link>

        <h1 className="page-title">Click On A Message To Download</h1>
        <p className="intro">Listen and download spirit-filled messages to uplift your faith.</p>

        <FolderLinks />
        <br />

        <SermonBrowser category="general" />

        <p className="more-messages">
          <Link className="download-btn breadCrumbs" to="/more-messages">
            More Messages
          </Link>
        </p>
      </main>

      {/* Pulse keyframe for the notice dot */}
      <style>{`
        @keyframes camp-notice-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(212, 168, 50, 0.6); }
          70%  { box-shadow: 0 0 0 7px rgba(212, 168, 50, 0); }
          100% { box-shadow: 0 0 0 0 rgba(212, 168, 50, 0); }
        }
      `}</style>
    </>
  );
}
