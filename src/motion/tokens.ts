/**
 * Flouss Motion Tokens
 * Central contract for animation durations, easings, and spring dynamics.
 * Strictly animates transform and opacity for 60fps performance.
 */

export const motionDurations = {
  fast: 0.12,
  base: 0.2,
  medium: 0.32,
  slow: 0.6,
  fastMs: 120,
  baseMs: 200,
  mediumMs: 320,
  slowMs: 600,
} as const;

export const motionEasings = {
  easeOut: [0.22, 1, 0.36, 1] as const,
  easeInOut: [0.65, 0, 0.35, 1] as const,
  easeOutCubic: 'cubic-bezier(0.22, 1, 0.36, 1)',
  easeInOutCubic: 'cubic-bezier(0.65, 0, 0.35, 1)',
} as const;

export const motionSprings = {
  default: {
    type: 'spring',
    stiffness: 380,
    damping: 32,
  } as const,
  snappy: {
    type: 'spring',
    stiffness: 340,
    damping: 26,
  } as const,
  gentle: {
    type: 'spring',
    stiffness: 180,
    damping: 24,
  } as const,
} as const;

export const motionTransitions = {
  fast: {
    duration: motionDurations.fast,
    ease: motionEasings.easeOut,
  },
  base: {
    duration: motionDurations.base,
    ease: motionEasings.easeOut,
  },
  slow: {
    duration: motionDurations.slow,
    ease: motionEasings.easeOut,
  },
  spring: motionSprings.default,
} as const;
