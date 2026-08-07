# `@budiauktioner/web-demo` — React + Vite live demo

Interactive demo for [`@budiauktioner/buildi-primitives`](../../README.md). React + TypeScript + Bootstrap 5,
running entirely in the browser, mirroring the surface of the Blazor demo in the
[`Buildi.Primitives`](https://github.com/BudiAuktioner/BudiAuktioner.Swedish) .NET repo.

The dev server consumes the primitives library directly from `../../src/` via a Vite alias, so
edits in either folder hot-reload immediately. No build step is needed during development.

## Quick start

From the repo root:

```sh
pnpm install
pnpm --filter @budiauktioner/web-demo dev
```

Then open <http://localhost:5173>.

## Scripts

Run from `samples/web`:

| Script           | Purpose                             |
| ---------------- | ----------------------------------- |
| `pnpm dev`       | Start the Vite dev server with HMR. |
| `pnpm build`     | Production build into `dist/`.      |
| `pnpm preview`   | Serve the production build locally. |
| `pnpm typecheck` | TypeScript-only check.              |

## GitHub Pages deployment

The repository workflow [`.github/workflows/web-demo.yml`](../../.github/workflows/web-demo.yml)
builds and publishes this folder to GitHub Pages on every push to `main`. The `BASE_PATH`
environment variable controls the asset path so the site works under
`https://budiauktioner.github.io/buildi-primitives/`.
