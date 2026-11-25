import { useReducedMotion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

export type AnimationMode = 'full' | 'calm' | 'off';

export function useMotionMode(): AnimationMode {
  return useAppStore((state) => state.animationMode ?? 'full');
}

/**
 * Check whether the user prefers reduced motion (system setting or test mock).
 */
export function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hook to check reduced motion preference.
 * Checks both system media query and framer-motion's useReducedMotion hook.
 */
export function useMotionPrefs(): boolean {
  const systemPref = getPrefersReducedMotion();
  const framerPref = useReducedMotion();
  const mode = useMotionMode();
  return Boolean(systemPref || framerPref || mode === 'off');
}
