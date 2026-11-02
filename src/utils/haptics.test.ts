/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isHapticsEnabled,
  setHapticsEnabled,
  isSoundEnabled,
  setSoundEnabled,
  playHapticFeedback,
  getOrInitIOSSwitch,
  initGlobalHaptics,
  HAPTIC_TRIGGER,
  _resetHapticsStateForTesting,
} from './haptics';

describe('Haptics v2 Module (jsdom)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useRealTimers();
    _resetHapticsStateForTesting();

    // Clean up any existing switch DOM between tests
    const container = document.getElementById('flouss-ios-switch-container');
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }

    // Mock iOS userAgent so iOS switch logic runs
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window.navigator, 'platform', {
      value: 'iPhone',
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window.navigator, 'maxTouchPoints', {
      value: 5,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('defaults to haptics enabled = true and sound enabled = false', () => {
    expect(isHapticsEnabled()).toBe(true);
    expect(isSoundEnabled()).toBe(false);
  });

  it('updates preferences via setHapticsEnabled and setSoundEnabled', () => {
    setHapticsEnabled(false);
    expect(isHapticsEnabled()).toBe(false);

    setHapticsEnabled(true);
    expect(isHapticsEnabled()).toBe(true);

    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);

    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
  });

  it('creates the hidden iOS switch DOM container with data-haptic="none"', () => {
    const label = getOrInitIOSSwitch();
    expect(label).not.toBeNull();
    expect(label?.id).toBe('flouss-ios-switch-label');
    expect(label?.getAttribute('data-haptic')).toBe('none');

    const input = document.getElementById('flouss-ios-switch-hack');
    expect(input).not.toBeNull();
    expect(input?.getAttribute('type')).toBe('checkbox');
    expect(input?.hasAttribute('switch')).toBe(true);
    expect(input?.getAttribute('data-haptic')).toBe('none');

    const container = document.getElementById('flouss-ios-switch-container');
    expect(container).not.toBeNull();
    expect(container?.getAttribute('data-haptic')).toBe('none');
  });

  it('triggers 1, 2, and 3 switch clicks for light, success, and error haptics on iOS', () => {
    vi.useFakeTimers();

    const label = getOrInitIOSSwitch();
    expect(label).not.toBeNull();

    let clickCount = 0;
    label?.addEventListener('click', () => {
      clickCount++;
    });

    // 1. Light haptic -> 1 click
    clickCount = 0;
    playHapticFeedback('light');
    expect(clickCount).toBe(1);

    // Advance past the 40ms throttle window
    vi.advanceTimersByTime(50);

    // 2. Success haptic -> 2 clicks (1 immediately + 1 after 65ms)
    clickCount = 0;
    playHapticFeedback('success');
    expect(clickCount).toBe(1);
    vi.advanceTimersByTime(70);
    expect(clickCount).toBe(2);

    // Advance past the 40ms throttle window
    vi.advanceTimersByTime(50);

    // 3. Error haptic -> 3 clicks (1 immediately + 1 after 50ms + 1 after 105ms)
    clickCount = 0;
    playHapticFeedback('error');
    expect(clickCount).toBe(1);
    vi.advanceTimersByTime(60);
    expect(clickCount).toBe(2);
    vi.advanceTimersByTime(60);
    expect(clickCount).toBe(3);
  });

  it('triggers haptics on pointerup for touch only if moved < 8px and < 500ms', () => {
    vi.useFakeTimers();
    const cleanup = initGlobalHaptics();

    const label = getOrInitIOSSwitch();
    let clickCount = 0;
    label?.addEventListener('click', () => {
      clickCount++;
    });

    const button = document.createElement('button');
    button.textContent = 'Tap Me';
    document.body.appendChild(button);

    // Case A: Clean quick tap (dx: 2px, dy: 3px, time: 100ms) -> triggers
    clickCount = 0;
    button.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerType: 'touch',
        clientX: 100,
        clientY: 100,
      })
    );
    vi.advanceTimersByTime(100);
    button.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        pointerType: 'touch',
        clientX: 102,
        clientY: 103,
      })
    );
    expect(clickCount).toBe(1);

    // Wait past throttle
    vi.advanceTimersByTime(50);

    // Case B: Scroll gesture (dx: 0px, dy: 40px) -> distance > 8px -> MUST NOT trigger
    clickCount = 0;
    button.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerType: 'touch',
        clientX: 100,
        clientY: 100,
      })
    );
    vi.advanceTimersByTime(100);
    button.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        pointerType: 'touch',
        clientX: 100,
        clientY: 140, // 40px scroll
      })
    );
    expect(clickCount).toBe(0);

    // Case C: Long press (600ms) -> duration > 500ms -> MUST NOT trigger tap haptic
    vi.advanceTimersByTime(50);
    clickCount = 0;
    button.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerType: 'touch',
        clientX: 100,
        clientY: 100,
      })
    );
    vi.advanceTimersByTime(600);
    button.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        pointerType: 'touch',
        clientX: 101,
        clientY: 101,
      })
    );
    expect(clickCount).toBe(0);

    cleanup();
    document.body.removeChild(button);
  });

  it('exports HAPTIC_TRIGGER constant', () => {
    expect(['pointerdown', 'pointerup']).toContain(HAPTIC_TRIGGER);
  });
});
