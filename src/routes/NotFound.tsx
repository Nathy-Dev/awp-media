import { Link, useLocation } from "react-router-dom";
import { useHead } from "../lib/useHead";

export default function NotFound() {
  const { pathname } = useLocation();

  useHead({
    title: "Page not found",
    description: "That page doesn't exist on awpwmedia.org.",
    noindex: true,
  });

  return (
    <main className="sermons-section container" style={{ padding: "3rem 0" }}>
      <h1 className="page-title">Page not found</h1>
      <p className="intro">
        There is nothing at <code>{pathname}</code>. It may have been moved.
      </p>

      <p className="back-home">
        <Link className="download-btn breadCrumbs" to="/">
          Back To Home
        </Link>
      </p>
    </main>
  );
}
