# Flouss public landing

Standalone React, TypeScript, Vite landing site. It does not import the main app and does not change the root build.

## Run locally

```sh
cd landing
npm ci
npm run dev
```

Set `VITE_APP_URL` to change the app destination; it defaults to `https://staging.flouss.live`.

## Build and preview

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

The static build includes Arabic (default), French, and English entry paths. Locale and theme controls are client-side and persist their current selection in the URL or browser storage.

## Visual QA

From `landing`, run `npm run capture`. The script starts a local preview, checks all locale/theme combinations at 390px and 1280px, writes full-page screenshots and scroll videos under `qa/feat-landing/output/`, then stops the preview server.

The WebGL product scene is lazy-loaded on desktop, capped to a reduced pixel ratio, paused outside its visible section, and replaced by a bundled SVG poster on mobile, when WebGL2 is unavailable, or when reduced motion is requested.
