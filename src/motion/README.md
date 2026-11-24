# Flouss Motion Primitives

Core motion system built on `framer-motion` adhering to 60fps performance standards.

- **Strict Property Whitelist**: Animate ONLY `transform` and `opacity`.
- **prefers-reduced-motion**: Built into every primitive via `useMotionPrefs()`. Degrades to zero-duration / static fallback.
- **Tokens**:
  - Durations: `fast` (150ms), `base` (250ms), `slow` (450ms)
  - Easings: `easeOut` [0.22, 1, 0.36, 1], `easeInOut` [0.65, 0, 0.35, 1]
  - Spring: `{ stiffness: 260, damping: 28 }`
- **Primitives**:
  - `Reveal`: Scroll/mount entrance (y: 12 → 0, opacity: 0 → 1, once).
  - `Stagger`, `StaggerItem`: Coordinated list/grid entrances.
  - `AnimatedNumber`: Rolling count-up with `tabular-nums` and `formatMAD`.
  - `DrawPath`: SVG chart stroke draw-in.
  - `GaugeArc`: Circular arc sweep for runway and goal percentages.
  - `Pressable`: Micro-interaction press scale (0.97) + hover lift (-1.5px).
  - `SkeletonShimmer`: Smooth linear gradient sweep, disabled under reduced motion.
