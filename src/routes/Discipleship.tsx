import { SermonBrowser } from "../components/SermonBrowser";
import { useHead } from "../lib/useHead";

export default function Discipleship() {
  useHead({
    title: "Discipleship Teachings",
    description:
      "Listen and download the discipleship teachings from Apostles of the Word and Prayer Worldwide.",
    path: "/discipleship",
  });

  return (
    <main className="sermons-section container" style={{ paddingBlock: "1.5rem" }}>
      <h1 className="page-title">Discipleship Teachings</h1>
      <p className="intro">Listen and download the discipleship teachings.</p>

      <SermonBrowser category="discipleship" showSearch={false} emptyMessage="No discipleship teachings yet." />
    </main>
  );
}
