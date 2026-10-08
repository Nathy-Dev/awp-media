import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    // Modern baseline: matches the browsers that support the CSS this app uses
    // (dvh, aspect-ratio, content-visibility) and keeps the bundle small.
    target: "es2020",
    cssCodeSplit: true,
    // Emit a build manifest so we can see which chunk holds what.
    manifest: true,
    rollupOptions: {
      output: {
        // Split the framework into its own chunk so app-code changes do not
        // invalidate it. The dashboard splits itself via React.lazy in App.tsx.
        // Expressed as a function because the object form was removed from
        // Rollup's `manualChunks` typedef.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          return /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)
            ? "framework"
            : undefined;
        },
      },
    },
  },
});
