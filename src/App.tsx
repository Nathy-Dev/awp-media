import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
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
  { from: "/index.html", to: "/" },
  { from: "/sermons.html", to: "/" },
  { from: "/dashboard/index.html", to: "/dashboard" },
] as const;

/** Preserves `?id=` on the old sermon template URL. */
function LegacySermonRedirect() {
  const { search } = useLocation();
  const id = new URLSearchParams(search).get("id");
  return <Navigate replace to={id === null ? "/" : `/sermons/${encodeURIComponent(id)}`} />;
}

export default function App() {
  return (
    <Routes>
      {/* Outside the site Layout: the dashboard is its own dark theme with no
          public header or footer, and its stylesheet is a separate chunk. */}
      <Route
        path="dashboard"
        element={
          <Suspense fallback={<Loader />}>
            <Dashboard />
          </Suspense>
        }
      />

      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="more-messages" element={<MoreMessages />} />
        <Route path="foundation" element={<Foundation />} />
        <Route path="discipleship" element={<Discipleship />} />
        <Route path="workers" element={<Workers />} />
        <Route path="sermons/:id" element={<SermonDetail />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="live" element={<Live />} />

        {LEGACY_REDIRECTS.map((redirect) => (
          <Route key={redirect.from} path={redirect.from} element={<Navigate replace to={redirect.to} />} />
        ))}
        <Route path="template/sermons.html" element={<LegacySermonRedirect />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
