# Project Design Context

## Project

- Name: Flouss public landing
- Product type: Moroccan personal-finance marketing site
- Stack: React 18, TypeScript, Vite, CSS
- Color mode: Light and dark
- Density: Comfortable

## Visual direction

- Light page: `#FAFAF9`; dark page: `#0B0B0C`
- Near-black text, thin neutral borders, low-shadow surfaces
- One rounded gray product-stage panel in the hero
- Green is reserved for monetary/positive states
- Latin type: Inter; Arabic type: Noto Sans Arabic; Arabic tracking stays normal
- Language-neutral ring/coin SVG mark; wordmark localized by language
- Scroll-linked blur-to-sharp reveals; reduced motion shows content without animation

## Constraints

- Arabic is the default locale and uses RTL.
- Support Arabic, French, and English, each with light and dark themes.
- Keep claims limited to PIN, local persistence, and no targeted advertising.
- Keep all implementation, generated screenshots, and QA assets inside this landing project.

## Decisions

- Use the language-neutral coin-ring symbol and localize the wordmark by language.
- Use flat neutral surfaces, a soft gray hero stage, and scroll-linked blur-to-sharp reveals.
