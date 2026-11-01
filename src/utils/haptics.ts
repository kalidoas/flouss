/**
 * Graceful Haptic Feedback Utility (Apple HIG Micro-interactions)
 * Triggers light vibration on supported mobile devices without throwing errors.
 */
export function triggerHaptic(duration = 50): void {
  try {
    if (
      typeof window !== 'undefined' &&
      'navigator' in window &&
      typeof navigator.vibrate === 'function'
    ) {
      navigator.vibrate([duration]);
    }
  } catch {
    // Fail silently on non-supporting devices
  }
}
