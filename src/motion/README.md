# Flouss motion primitives

Reusable UI motion components live in this folder and are exported from `src/motion/index.ts`.

- Durations: 120 / 200 / 320 / 600ms.
- Spring: stiffness 380, damping 32.
- Preferences: `Full`, `Calm`, and `Off`, plus the operating-system reduced-motion setting.
- Motion should primarily use transform and opacity; all effects need a reduced-motion fallback.
- `Money` is the only React component that formats and renders a monetary amount.
- Add or update each screen's single signature moment in `docs/MOTION_INDEX.md`.

Existing foundations: `Reveal`, `Stagger`, `AnimatedNumber`, `DrawPath`, `GaugeArc`, `Pressable`, and `SkeletonShimmer`.
New primitives: `BalanceRoll`, `PageTransition`, `SharedCard`, `SpringSheet`, `ChartDraw`, `KineticHeadline`, `Indicator`, `SwipeRow`, `Tilt3D`, and lazy `Coin3D`.
