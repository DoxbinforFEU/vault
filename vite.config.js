import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// base: "./" makes all asset paths relative, so the built app works on
// GitHub Pages project sites (e.g. /vaultie/) without hardcoding the repo name.
// Do NOT change this — the live URL depends on it.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    target: "es2020",
    rollupOptions: {
      // Two entry pages: the student app and the admin dashboard (admin.html).
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        admin: fileURLToPath(new URL("./admin.html", import.meta.url)),
      },
      output: {
        // Keep React in its own long-cached chunk so app updates don't force a
        // re-download of the framework.
        manualChunks: {
          react: ["react", "react-dom"],
        },
      },
    },
  },
});
