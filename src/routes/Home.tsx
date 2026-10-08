import { Link } from "react-router-dom";
import { FolderLinks } from "../components/FolderLinks";
import { SermonBrowser } from "../components/SermonBrowser";
import { useHead } from "../lib/useHead";

export default function Home() {
  useHead({
    title: "Apostles of the Word and Prayer Worldwide",
    path: "/",
  });

  return (
    <main className="sermons-section container" style={{ padding: "1.5rem 0" }}>
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
  );
}
