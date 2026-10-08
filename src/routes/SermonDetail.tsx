import { Link, useParams } from "react-router-dom";
import { TrackRow } from "../components/DownloadButton";
import { SermonCard } from "../components/SermonCard";
import { Loader } from "../components/Loader";
import { useCoverManifest } from "../lib/image";
import { useSermons } from "../lib/useSermons";
import { useTrackAvailability } from "../lib/useTrackAvailability";
import { useHead } from "../lib/useHead";
import { resolveImagePath } from "../lib/sermons";

/**
 * A single message and its downloadable tracks.
 *
 * Replaces `/template/sermons.html?id=…`, which the router still redirects here
 * from. The old page fetched and re-parsed the whole 72KB index a second time
 * and rendered the tracks by building `innerHTML` a string at a time.
 */
export default function SermonDetail() {
  const { id = "" } = useParams();
  const state = useSermons();
  const covers = useCoverManifest();
  const unavailable = useTrackAvailability();

  const sermon = state.status === "ready" ? state.sermons.find((item) => item.id === id) : undefined;

  useHead({
    title: sermon?.title ?? "Message",
    description:
      sermon === undefined
        ? undefined
        : `Listen and download “${sermon.title}” from Apostles of the Word and Prayer Worldwide.`,
    image: sermon === undefined ? undefined : `https://awpwmedia.org${resolveImagePath(sermon.image)}`,
    path: `/sermons/${id}`,
    type: "article",
    // A missing id still renders a "not found" page; no reason to index it.
    noindex: sermon === undefined,
  });

  if (state.status === "loading") return <Loader />;

  if (state.status === "error") {
    return (
      <main className="sermons-section container" style={{ padding: "1.5rem 0" }}>
        <p className="grid-message" role="alert">
          {state.message}
        </p>
      </main>
    );
  }

  if (sermon === undefined) {
    return (
      <main className="sermons-section container" style={{ padding: "1.5rem 0" }}>
        <h1 className="page-title">Message not found</h1>
        <p className="intro">
          We couldn&apos;t find that message. It may have been renamed or removed.
        </p>
        <p className="back-home">
          <Link className="download-btn breadCrumbs" to="/">
            Back To Home
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: "1.5rem 0" }}>
      <div id="sermon-detail" className="container">
        <SermonCard sermon={sermon} cover={covers?.[sermon.id]} variant="detail" />

        <div className="tracks">
          <h1 className="sermon-detail-title">{sermon.title}</h1>
          {sermon.tracks.length === 0 && <p className="intro">No recordings are available for this message yet.</p>}
          {sermon.tracks.map((track) => (
            <TrackRow key={track.file} track={track} unavailable={unavailable.has(track.file)} />
          ))}
        </div>
      </div>

      <p className="back-home">
        <Link className="download-btn breadCrumbs" to="/">
          Back To Home
        </Link>
      </p>
    </main>
  );
}
