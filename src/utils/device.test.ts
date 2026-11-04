/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isIOS, isStandalonePWA, triggerAddToHomeScreenPrompt } from './device';

describe('device utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('isIOS', () => {
    it('detects iPhone from userAgent', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
        configurable: true,
      });
      expect(isIOS()).toBe(true);
    });

    it('detects iPad with MacIntel platform and multi-touch', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });
      Object.defineProperty(window.navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });
      Object.defineProperty(window.navigator, 'maxTouchPoints', {
        value: 5,
        configurable: true,
      });
      expect(isIOS()).toBe(true);
    });

    it('returns false for Android userAgent', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)',
        configurable: true,
      });
      Object.defineProperty(window.navigator, 'platform', {
        value: 'Linux armv8l',
        configurable: true,
      });
      Object.defineProperty(window.navigator, 'maxTouchPoints', {
        value: 5,
        configurable: true,
      });
      expect(isIOS()).toBe(false);
    });
  });

  describe('isStandalonePWA', () => {
    it('returns true when navigator.standalone is true (iOS Safari PWA)', () => {
      (window.navigator as any).standalone = true;
      expect(isStandalonePWA()).toBe(true);
      delete (window.navigator as any).standalone;
    });

    it('returns true when matchMedia matches display-mode: standalone', () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      expect(isStandalonePWA()).toBe(true);
    });

    it('returns false in standard browser tab', () => {
      (window.navigator as any).standalone = false;
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
      }));

      expect(isStandalonePWA()).toBe(false);
    });
  });

  describe('triggerAddToHomeScreenPrompt', () => {
    it('dispatches custom event flouss:show-add-to-home-screen on window', () => {
      const listener = vi.fn();
      window.addEventListener('flouss:show-add-to-home-screen', listener);

      triggerAddToHomeScreenPrompt();

      expect(listener).toHaveBeenCalledTimes(1);
      window.removeEventListener('flouss:show-add-to-home-screen', listener);
    });
  });
});
