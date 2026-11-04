/**
 * Device & Platform Utility Helpers
 * Specialized detection for iOS (iPhone/iPad) and Standalone Home Screen PWA environments.
 */

export function isIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia?.('(display-mode: standalone)').matches === true
  );
}

/**
 * Event emitter to show the "Add to Home Screen" iOS bottom sheet
 */
export function triggerAddToHomeScreenPrompt(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('flouss:show-add-to-home-screen'));
  }
}
