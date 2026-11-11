import { SITE_URL, useHead } from "../lib/useHead";
import "../styles/camp-notice.css";

export default function CampNotice() {
  useHead({
    title: "BPAW Camp Meeting — See You in 2027",
    description:
      "BPAW Camp Meeting 2026 has concluded and registration is closed. Thank you for joining us! See you in 2027; next year's details will be announced here.",
    path: "/bpaw",
  });

  return (
    <div className="cn-page">
      <header className="cn-header">
        <div className="cn-brand">
          <img
            src="/icons/awp-logo-192x192.png"
            alt="AWPW Logo"
            width={42}
            height={42}
          />
          <span>Apostles of the Word and Prayer Worldwide</span>
        </div>
        <h1>BPAW Camp Meeting</h1>
      </header>

      <main className="cn-notice">
        <p className="cn-year">2026 Camp Concluded</p>
        <h2>Till next year!</h2>
        <p>
          BPAW Camp Meeting 2026 has concluded. Thank you for being part of it!
        </p>
        <p>
          Registration is now closed. We look forward to gathering again in{" "}
          <strong>2027</strong>. Next year's camp details will be shared here
          when they are announced.
        </p>
        <a className="cn-home-link" href={SITE_URL}>Back to messages</a>
      </main>

      <footer className="cn-footer">
        King David Road, Rumuokwurusi, Port Harcourt
      </footer>
    </div>
  );
}
