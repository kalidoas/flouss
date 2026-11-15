# SENIOR DESIGNER SKILL & THE 22 BACKGROUNDS KIT

## 1. Core Mandate (Anti-Generic Rule)
Flouss is a calm, Apple-like finance app. Restraint first: flat tokenized surfaces and a strong hierarchy. The textures in this kit are an optional accent layer, used only where the Flouss scope below allows.

## 2. Flouss Scope
- **Allowed zones**: login / sign-up / OTP / PIN screens, welcome and initial-balance onboarding, empty states, and the Dashboard balance hero card (very subtle and static).
- **Never behind or inside**: tables, lists, forms, modals/sheets, charts, or the Expenses, History, Analytics, Categories, Income, Debts, Subscriptions, Notes, Settings and Program pages.
- **Allowed styles**: grainy gradients, noise texture, subtle fluted glass, dot matrix for empty states. Paper, blueprint, halftone and topographic only if I ask. Not allowed by default: WebGL, ASCII, iridescent 3D, caustics, and every image-based style (15-22) unless I name one and provide a licensed image.
- **Max one decorative background per screen**; static by default on mobile; any animation must pause off-screen (IntersectionObserver), obey prefers-reduced-motion and have a static fallback.
- **Performance/Maintainability**: Must work in light and dark through the existing theme tokens, keep AA text contrast, be RTL-safe, add no dependency, load no remote image, and cost under ~10 KB of JS per effect. Isolate each effect in components/backgrounds/ so removing it is one line.
- **Constraints**: A background never changes layout, data or logic.

## 3. Implementation & Performance Rules
- **Code-First Execution**: Build styles using pure CSS, inline SVG filters (`feTurbulence`, `feDisplacementMap`), HTML5 Canvas, or lightweight WebGL shaders. Ask me before installing heavy external 3D libraries.
- **Contrast & Readability**: Always ensure high text contrast on top of backgrounds. Add subtle scrims, radial vignettes, or backdrop blurs behind typography so text is effortlessly readable.
- **Performance**: Respect `prefers-reduced-motion` and use `IntersectionObserver` to pause any canvas/WebGL animations when the section is off-screen.
- **No Fake CSS Photos**: Never try to fake realistic grass, clouds, or paintings using pure CSS—it looks cheap. If a chosen style requires a real image, either ask me for the image file or use a high-res public domain image (e.g., from Wikimedia Commons, NASA, or The Met Open Access).
- **Modularity**: Keep background effects isolated in their own clean React wrapper or component so they can be swapped or removed in one line.

## 4. Category A: Code-Only Styles (No Image Needed — Use Freely!)
When designing sections (especially Heroes, CTAs, and Feature showcases), autonomously pick or combine from these 14 pure-code styles:

1. **Thermal gradients**: A heat-map look like a thermal camera using soft, shifting multi-color radial blobs (deep blue, magenta, orange, yellow) with heavy blur.
2. **Fluted glass**: A reeded/ribbed glass panel (`backdrop-filter` + repeating linear gradient ridges) placed over a bright, moving blurred gradient.
3. **Water caustics**: The dancing light net seen on the floor of a pool, built via SVG turbulence/displacement or a lightweight canvas shader.
4. **Halftone**: A bold geometric shape or gradient rendered through a classic varying-size dot screen pattern.
5. **Blueprint grids**: Deep architectural blueprint blue (or dark slate) with a fine `8px` sub-grid and a bolder `64px` major structural grid.
6. **Felt texture**: Soft wool felt aesthetic with visible directional micro-fibers generated via SVG noise filters over a rich solid color.
7. **Grainy gradients**: Large, soft, organic color blobs melting into each other beneath a crisp SVG `feTurbulence` noise overlay.
8. **Paper texture**: Warm off-white/stone editorial paper with subtle fibers and slightly uneven lighting/vignette tone.
9. **Topographic lines**: Thin, organic elevation contour lines like a hiking map (`stroke` SVG paths) that subtly drift or react to cursor movement.
10. **Noise texture**: Matte charcoal dark mode surface with fine speckled monochromatic grain and a soft top-down ambient light.
11. **Dot matrix**: An interactive grid of small squares/dots like an LED board, where brightness pulses or reacts to mouse proximity.
12. **Stippled gradients**: Two contrasting colors that dissolve into each other through dense stipple/dither dots rather than a smooth band.
13. **ASCII art**: A dynamic 3D rotating torus/shape or background wave rendered entirely out of monospace text characters (`@`, `#`, `+`, `.`) on a canvas.
14. **Iridescent 3D**: A sleek, glossy 3D geometric object with a rainbow thin-film / holographic reflection floating in the hero background.

## 5. Category B: Image-Based Styles (Ask for Image or Fetch Public Domain)
Use these 8 styles when a visual/photographic mood is needed (always apply via Canvas/SVG/WebGL filters on a real image):

15. **Monochrome landscapes**: High-contrast landscape photography recolored to a single duotone/monochrome brand tint.
16. **Dithered images**: An image reduced to 2 stark colors using a visible Floyd-Steinberg or Bayer matrix pixel dither.
17. **Grass texture**: A top-down high-res lawn/nature texture used full-bleed with crisp white editorial typography on top.
18. **Impressionist paintings**: Full-bleed public-domain classic artwork (from The Met Open Access) paired with modern minimalist UI cards.
19. **Cloudy sky**: Soft, atmospheric sky photography used as an airy, expansive hero background.
20. **Pixel mosaic**: Black-and-white photography broken into a clean interactive mosaic of larger pixel tiles.
21. **Blurred photos**: A vibrant photograph blurred so heavily it becomes an organic, atmospheric wash of soft colors.
22. **Lens distortion**: Photography or typography viewed through a glass refraction / chromatic aberration lens distortion effect on hover.

## 6. Pro-Level Combinations (Stacking Rules)
As a Senior Designer, you know the best results mix a **texture** with a **structure**. Proactively use these winning combinations when appropriate:
- **Modern SaaS / Fintech (e.g., Flouss)**: `Grainy gradients` + `Fluted glass` OR `Noise texture` + `Dot matrix`.
- **Technical / DevTools / Analytics**: `Blueprint grids` + `Topographic lines`.
- **Editorial / Creative Portfolio**: `Paper texture` + `Halftone`.

## 7. How You Must Work With Me
- If I say *"Design this page like a senior"* without naming a style, analyze the app's niche, pick the best combination from Section 4 or Section 6, build it, and tell me in one line what style you chose and how to tweak/remove it.
- If I say *"Next style: [Name]"* or *"Keep the current background and add [Style] on top of it"*, immediately swap or layer that exact style on the target section without breaking my layout.
