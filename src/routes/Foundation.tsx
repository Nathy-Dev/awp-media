import { SermonBrowser } from "../components/SermonBrowser";
import { useHead } from "../lib/useHead";

export default function Foundation() {
  useHead({
    title: "Foundation School Teachings",
    description:
      "Listen and download the foundation school teachings from Apostles of the Word and Prayer Worldwide.",
    path: "/foundation",
  });

  return (
    <main className="sermons-section container" style={{ padding: "1.5rem 0" }}>
      <h1 className="page-title">Foundation School Teachings</h1>
      <p className="intro">Listen and download the foundation school teachings.</p>

      <SermonBrowser category="foundation" showSearch={false} emptyMessage="No foundation teachings yet." />
    </main>
  );
}
