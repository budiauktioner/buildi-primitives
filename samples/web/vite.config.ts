import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const primitivesSrc = path.resolve(here, "../../src");

// `BASE_PATH` is set in CI when deploying to GitHub Pages so that asset URLs
// resolve under `/<repo>/`. Locally we want a clean root.
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: [
      // Subpath imports first (more specific) so they don't match the root.
      { find: /^@buildi\/primitives\/(.*)$/, replacement: `${primitivesSrc}/$1/index.ts` },
      { find: "@budiauktioner/buildi-primitives", replacement: `${primitivesSrc}/index.ts` },
    ],
  },
  server: {
    port: 5173,
    open: false,
  },
});
