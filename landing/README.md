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

From `landing`, run `npm run capture`. The script starts a local preview, checks Arabic, French, and English in light and dark themes at 390px and 1280px, and writes full-page screenshots under `landing/qa/feat-landing/output/`.

The hero product stage is static and CSS-built. Section reveals are linked to scroll progress and resolve to their final state when reduced motion is requested.
