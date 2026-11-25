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

From `landing`, run `npm run capture`. The script starts a local preview, checks Arabic, French, and English in light and dark themes at 390px, and writes six full-page mobile screenshots under `qa/feat-landing/output/screenshots/`. It also renders the three localized Open Graph images.

The hero product stage is static and CSS-built; its visual is not an app screenshot. Only the hero headline animates, word by word, and reduced-motion mode disables that animation.
