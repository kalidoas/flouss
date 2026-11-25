import React from 'react';

/** A quiet, static grain wash for the dashboard balance hero only. */
export const GrainyHeroBackdrop: React.FC = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
    <div
      className="absolute inset-0 opacity-80 dark:opacity-60"
      style={{
        background:
          'radial-gradient(ellipse at 88% 6%, color-mix(in srgb, var(--accent-warm) 13%, transparent), transparent 52%), radial-gradient(ellipse at 70% 100%, color-mix(in srgb, var(--positive) 5%, transparent), transparent 56%)',
      }}
    />
    <svg className="absolute inset-0 h-full w-full opacity-[0.075] mix-blend-soft-light" aria-hidden="true">
      <filter id="flouss-hero-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#flouss-hero-grain)" />
    </svg>
  </div>
);
