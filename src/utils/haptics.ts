/**
 * iOS & Mobile Haptic Feedback Engine
 * Handles navigator.vibrate (Android/Chrome), Capacitor Haptics (hybrid),
 * and Web Audio API acoustic micro-tick fallback for iOS WebKit/Safari where vibration is blocked.
 */

export type HapticType = 'light' | 'medium' | 'success' | 'rigid';

let audioCtx: AudioContext | null = null;

// Initialize or resume AudioContext safely on user gestures
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

// Subtle Apple-like mechanical micro-tick for iOS Safari
function playSubtleAudioTick(type: HapticType = 'light'): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'success') {
      // Gentle two-tone success chord for completing Salat, tasks, or saving transactions
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.05); // G5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else {
      // Crisp mechanical tick
      const startFreq = type === 'rigid' ? 320 : type === 'medium' ? 240 : 180;
      const duration = type === 'medium' ? 0.022 : 0.016;
      const volume = type === 'medium' ? 0.07 : 0.045;

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
  } catch {
    // Fail silently
  }
}

export function playHapticFeedback(type: HapticType = 'light'): void {
  let vibrationSucceeded = false;

  // 1. Try Capacitor Haptics if running in native wrapper
  try {
    const cap = (window as any).Capacitor;
    if (cap?.Plugins?.Haptics) {
      if (type === 'success') {
        cap.Plugins.Haptics.notification({ type: 'SUCCESS' }).catch(() => {});
      } else {
        cap.Plugins.Haptics.impact({
          style: type === 'medium' ? 'MEDIUM' : type === 'rigid' ? 'HEAVY' : 'LIGHT',
        }).catch(() => {});
      }
    }
  } catch {}

  // 2. Check if navigator.vibrate is supported (Android, Chrome, Firefox)
  try {
    if (
      typeof window !== 'undefined' &&
      'navigator' in window &&
      typeof navigator.vibrate === 'function'
    ) {
      const patterns: Record<HapticType, number | number[]> = {
        light: 25,
        medium: 45,
        rigid: 35,
        success: [30, 40, 50],
      };
      vibrationSucceeded = navigator.vibrate(patterns[type]);
    }
  } catch {
    vibrationSucceeded = false;
  }

  // 3. iOS Safari / WebKit or vibration failure fallback: play acoustic micro-tick
  const isIOS =
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  if (isIOS || !vibrationSucceeded) {
    playSubtleAudioTick(type);
  }
}
