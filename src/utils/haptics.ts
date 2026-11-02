/**
 * iOS & Mobile Haptic Feedback Engine v2
 * High-performance sensory feedback layer:
 * - Native iOS 18+ Taptic Engine impact via hidden WebKit switch toggle
 * - Android / Chrome navigator.vibrate patterns
 * - Capacitor Haptics bridge for hybrid native apps
 * - Optional acoustic micro-ticks via Web Audio API (default: OFF)
 * - 40ms throttling & prefers-reduced-motion compliance
 * - Event delegation for 0ms latency across all interactive elements
 */

export type HapticType =
  | 'light'
  | 'medium'
  | 'rigid'
  | 'selection'
  | 'success'
  | 'error'
  | 'none';

let audioCtx: AudioContext | null = null;
let lastHapticTimestamp = 0;
const HAPTIC_THROTTLE_MS = 40;

const STORAGE_KEY_HAPTICS = 'flouss_haptics_enabled';
const STORAGE_KEY_SOUND = 'flouss_sound_enabled';

/**
 * Check if haptic feedback is enabled (default: true)
 */
export function isHapticsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(STORAGE_KEY_HAPTICS) !== 'false';
  } catch {
    return true;
  }
}

/**
 * Toggle haptic feedback setting
 */
export function setHapticsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_HAPTICS, String(enabled));
  } catch {}
}

/**
 * Check if sound micro-ticks are enabled (default: false)
 */
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY_SOUND) === 'true';
  } catch {
    return false;
  }
}

/**
 * Toggle sound micro-ticks setting
 */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SOUND, String(enabled));
  } catch {}
}

/**
 * Detect prefers-reduced-motion
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * iOS WebKit Switch Hack DOM node
 * In iOS 17.4+ / iOS 18+, clicking an <input type="checkbox" switch> label
 * natively triggers the iPhone hardware Taptic Engine impact!
 */
let iosSwitchLabel: HTMLLabelElement | null = null;

export function getOrInitIOSSwitch(): HTMLLabelElement | null {
  if (typeof document === 'undefined') return null;
  if (iosSwitchLabel && document.body?.contains(iosSwitchLabel)) {
    return iosSwitchLabel;
  }

  try {
    const existing = document.getElementById('flouss-ios-switch-label') as HTMLLabelElement | null;
    if (existing) {
      iosSwitchLabel = existing;
      return existing;
    }

    const container = document.createElement('div');
    container.id = 'flouss-ios-switch-container';
    container.setAttribute('aria-hidden', 'true');
    container.style.cssText =
      'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;width:0;height:0;z-index:-1;overflow:hidden;';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = 'flouss-ios-switch-hack';
    input.setAttribute('switch', '');

    const label = document.createElement('label');
    label.htmlFor = 'flouss-ios-switch-hack';
    label.id = 'flouss-ios-switch-label';

    container.appendChild(input);
    container.appendChild(label);
    document.body.appendChild(container);

    iosSwitchLabel = label;
    return label;
  } catch {
    return null;
  }
}

function triggerIOSSwitch(): void {
  try {
    const label = getOrInitIOSSwitch();
    if (label) {
      label.click();
    }
  } catch {}
}

/**
 * Initialize or resume AudioContext safely on user gestures
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Subtle synthesized mechanical micro-tick for optional Sound Feedback (default: OFF)
 */
function playSubtleAudioTick(type: HapticType = 'light'): void {
  if (!isSoundEnabled() || prefersReducedMotion()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.05); // G5
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'error') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else {
      const startFreq =
        type === 'rigid' ? 320 : type === 'medium' ? 240 : type === 'selection' ? 140 : 180;
      const duration = type === 'medium' ? 0.022 : type === 'selection' ? 0.012 : 0.016;
      const volume = type === 'medium' ? 0.06 : type === 'selection' ? 0.03 : 0.045;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + duration);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    }
  } catch {}
}

/**
 * Vibration patterns for Android and Chrome
 */
const VIBRATION_PATTERNS: Record<Exclude<HapticType, 'none'>, number | number[]> = {
  selection: 10,
  light: 20,
  medium: 38,
  rigid: 30,
  success: [25, 35, 30],
  error: [35, 40, 35, 40, 50],
};

/**
 * Primary Haptic Feedback Trigger
 */
export function playHapticFeedback(type: HapticType = 'light'): void {
  if (type === 'none') return;
  if (!isHapticsEnabled() && !isSoundEnabled()) return;
  if (prefersReducedMotion()) return;

  const now = Date.now();
  if (now - lastHapticTimestamp < HAPTIC_THROTTLE_MS) {
    return;
  }
  lastHapticTimestamp = now;

  if (isHapticsEnabled()) {
    // 1. Capacitor Native Shell Plugin (iOS / Android binary)
    try {
      const cap = (window as any).Capacitor;
      if (cap?.Plugins?.Haptics) {
        if (type === 'success') {
          cap.Plugins.Haptics.notification({ type: 'SUCCESS' }).catch(() => {});
        } else if (type === 'error') {
          cap.Plugins.Haptics.notification({ type: 'ERROR' }).catch(() => {});
        } else {
          cap.Plugins.Haptics.impact({
            style:
              type === 'medium'
                ? 'MEDIUM'
                : type === 'rigid'
                ? 'HEAVY'
                : 'LIGHT',
          }).catch(() => {});
        }
      }
    } catch {}

    // 2. Android / Chrome standard navigator.vibrate
    let vibrationTriggered = false;
    try {
      if (
        typeof window !== 'undefined' &&
        'navigator' in window &&
        typeof navigator.vibrate === 'function'
      ) {
        const pattern = VIBRATION_PATTERNS[type];
        if (pattern) {
          vibrationTriggered = navigator.vibrate(pattern);
        }
      }
    } catch {
      vibrationTriggered = false;
    }

    // 3. iOS 18+ Safari WebKit Switch Hack (Native Taptic Engine on real iPhone)
    const isIOS =
      typeof navigator !== 'undefined' &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

    if (isIOS || !vibrationTriggered) {
      if (type === 'success') {
        triggerIOSSwitch();
        setTimeout(triggerIOSSwitch, 65);
      } else if (type === 'error') {
        triggerIOSSwitch();
        setTimeout(triggerIOSSwitch, 50);
        setTimeout(triggerIOSSwitch, 105);
      } else {
        triggerIOSSwitch();
      }
    }
  }

  // 4. Optional Web Audio acoustic micro-tick (only if explicitly enabled in Settings)
  if (isSoundEnabled()) {
    playSubtleAudioTick(type);
  }
}

/**
 * Capture-phase global event delegation installer
 * Automatically activates 0ms physical sensory feedback on all interactive elements.
 */
let isGlobalHapticsInstalled = false;

export function initGlobalHaptics(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }
  if (isGlobalHapticsInstalled) {
    return () => {};
  }
  isGlobalHapticsInstalled = true;

  // Ensure iOS switch DOM is prepared early
  getOrInitIOSSwitch();

  const INTERACTIVE_SELECTOR =
    'button, a[href], [role="button"], [role="tab"], [role="switch"], [role="menuitem"], [role="option"], summary, [data-haptic]';

  const handlePointerDown = (e: PointerEvent) => {
    // Primary touch/mouse button only
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const target = (e.target as HTMLElement | null)?.closest(INTERACTIVE_SELECTOR) as HTMLElement | null;
    if (!target) return;

    // Skip disabled elements
    if (
      (target as HTMLButtonElement).disabled ||
      target.getAttribute('aria-disabled') === 'true'
    ) {
      return;
    }

    const hapticAttr = target.getAttribute('data-haptic') as HapticType | null;
    if (hapticAttr === 'none') return;

    const type: HapticType = hapticAttr || 'light';
    playHapticFeedback(type);
  };

  const handleChange = (e: Event) => {
    const target = (e.target as HTMLElement | null)?.closest(
      'input[type="checkbox"], input[type="radio"], select, [role="switch"]'
    ) as HTMLElement | null;
    if (!target) return;

    if (
      (target as HTMLInputElement).disabled ||
      target.getAttribute('aria-disabled') === 'true' ||
      target.getAttribute('data-haptic') === 'none'
    ) {
      return;
    }

    playHapticFeedback('selection');
  };

  document.addEventListener('pointerdown', handlePointerDown, { capture: true, passive: true });
  document.addEventListener('change', handleChange, { capture: true, passive: true });

  return () => {
    document.removeEventListener('pointerdown', handlePointerDown, { capture: true });
    document.removeEventListener('change', handleChange, { capture: true });
    isGlobalHapticsInstalled = false;
  };
}
