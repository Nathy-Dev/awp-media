import { SermonBrowser } from "../components/SermonBrowser";
import { useHead } from "../lib/useHead";

export default function Workers() {
  useHead({
    title: "Workers Teachings",
    description:
      "Listen and download the workers teachings from Apostles of the Word and Prayer Worldwide.",
    path: "/workers",
  });

  return (
    <main className="sermons-section container" style={{ paddingBlock: "1.5rem" }}>
      <h1 className="page-title">Workers Teachings</h1>
      <p className="intro">Listen and download the workers teachings.</p>

      <SermonBrowser category="workers" showSearch={false} emptyMessage="No workers teachings yet." />
    </main>
  );
}
