import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/global.css";

const container = document.getElementById("root");
if (container === null) throw new Error("#root is missing from index.html");

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

/**
 * Analytics, loaded after the first paint.
 *
 * The old build had the gtag snippet in `<head>` on all nine pages, where it
 * competes with the stylesheet and the fonts for the main thread during the
 * window that determines LCP. Deferring it to idle costs nothing measurable in
 * the reports and keeps it off the critical path.
 */
const GA_ID = import.meta.env.VITE_GA_ID;
if (typeof GA_ID === "string" && GA_ID.length > 0) {
  const load = (): void => {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    const inline = document.createElement("script");
    inline.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}');
    `;
    document.head.appendChild(inline);
  };

  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(load);
  else window.setTimeout(load, 2000);
}
