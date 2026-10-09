import { SermonBrowser } from "../components/SermonBrowser";
import { useHead } from "../lib/useHead";

/**
 * Full archive of general messages.
 *
 * This page rendered nothing on the old build: it had no `#sermonList` element
 * for `script.js` to fill, and it asked the browser for `../sermons.js`, which
 * does not exist. It also had no link pointing at it from anywhere on the site.
 */
export default function MoreMessages() {
  useHead({
    title: "More Messages",
    description:
      "The full archive of messages from Apostles of the Word and Prayer Worldwide — listen and download.",
    path: "/more-messages",
  });

  return (
    <main className="sermons-section container" style={{ paddingBlock: "1.5rem" }}>
      <h1 className="page-title">More Messages</h1>
      <p className="intro">The full archive. Search by title, or browse the category folders from the home page.</p>

      <SermonBrowser category="general" emptyMessage="No messages have been published yet." />
    </main>
  );
}
