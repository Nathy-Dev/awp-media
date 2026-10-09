import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, useLocation } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Loader } from "./components/Loader";
import Home from "./routes/Home";
import MoreMessages from "./routes/MoreMessages";
import Foundation from "./routes/Foundation";
import Discipleship from "./routes/Discipleship";
import Workers from "./routes/Workers";
import SermonDetail from "./routes/SermonDetail";
import About from "./routes/About";
import Contact from "./routes/Contact";
import Live from "./routes/Live";
import NotFound from "./routes/NotFound";
import CampRegistration from "./routes/CampRegistration";

/**
 * The admin dashboard pulls in the GitHub and archive.org clients, and is only
 * ever opened by the two people who publish sermons. Splitting it out keeps that
 * code out of the public bundle entirely.
 */
const Dashboard = lazy(() => import("./routes/Dashboard"));

/**
 * Pre-rewrite URLs.
 *
 * `vercel.json` sends unknown paths to `index.html`, so these still arrive at
 * the app — but a browser that already cached the old GitHub Pages build may
 * request them directly. Redirecting in the router keeps them working in
 * `npm run dev` too, where there is no rewrite rule.
 */
const LEGACY_REDIRECTS = [
  { from: "index.html", to: "/" },
  { from: "sermons.html", to: "/" },
  { from: "dashboard/index.html", to: "/dashboard" },
] as const;

/** Preserves `?id=` on the old sermon template URL. */
function LegacySermonRedirect() {
  const { search } = useLocation();
  const id = new URLSearchParams(search).get("id");
  return <Navigate replace to={id === null ? "/" : `/sermons/${encodeURIComponent(id)}`} />;
}

/**
 * Built with `createBrowserRouter` rather than `<BrowserRouter>` + `<Routes>`
 * deliberately: `ScrollRestoration` in the Layout is a data-router API and
 * throws "useMatches must be used within a data router" under the plain router,
 * which leaves the whole app unmounted and the page blank.
 */
export const router = createBrowserRouter([
  {
    // Outside the site Layout: the dashboard is its own dark theme with no
    // public header or footer, and its stylesheet is a separate chunk.
    path: "dashboard",
    element: (
      <Suspense fallback={<Loader />}>
        <Dashboard />
      </Suspense>
    ),
  },
  {
    // Standalone page — no site header/footer.
    // Accessible at awpwmedia.org/bpaw and at the bpaw.awpwmedia.org subdomain.
    path: "bpaw",
    element: <CampRegistration />,
  },
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "more-messages", element: <MoreMessages /> },
      { path: "foundation", element: <Foundation /> },
      { path: "discipleship", element: <Discipleship /> },
      { path: "workers", element: <Workers /> },
      { path: "sermons/:id", element: <SermonDetail /> },
      { path: "about", element: <About /> },
      { path: "contact", element: <Contact /> },
      { path: "live", element: <Live /> },

      ...LEGACY_REDIRECTS.map((redirect) => ({
        path: redirect.from,
        element: <Navigate replace to={redirect.to} />,
      })),
      { path: "template/sermons.html", element: <LegacySermonRedirect /> },

      { path: "*", element: <NotFound /> },
    ],
  },
]);
