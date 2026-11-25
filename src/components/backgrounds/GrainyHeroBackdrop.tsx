import React from 'react';

/** A restrained static grain wash behind the animated balance object. */
export const GrainyHeroBackdrop: React.FC = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
    <div
      className="absolute inset-0 opacity-100 dark:opacity-90"
      style={{
        background:
          'radial-gradient(ellipse at 92% 4%, color-mix(in srgb, var(--accent-warm) 25%, transparent), transparent 46%), radial-gradient(ellipse at 78% 100%, color-mix(in srgb, var(--positive) 8%, transparent), transparent 56%)',
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
