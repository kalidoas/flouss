/**
 * Flouss In-App Synthesized Audio Alarm Engine (Zero-dependency Web Audio API)
 * Generates bundled high-fidelity alarm tones with 0 network requests and 0 latency.
 */

export type AlarmToneType = 'chime' | 'radar' | 'gentle';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a single chime tone pulse
 */
function playChimeOnce(ctx: AudioContext, time: number) {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time + idx * 0.08);

    gain.gain.setValueAtTime(0, time + idx * 0.08);
    gain.gain.linearRampToValueAtTime(0.25, time + idx * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + idx * 0.08 + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time + idx * 0.08);
    osc.stop(time + idx * 0.08 + 0.65);
  });
}

/**
 * Play a radar tone pulse (two crisp fast pings)
 */
function playRadarOnce(ctx: AudioContext, time: number) {
  const pings = [0, 0.14];
  pings.forEach((offset) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, time + offset); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, time + offset + 0.08); // A6

    gain.gain.setValueAtTime(0.3, time + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, time + offset + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time + offset);
    osc.stop(time + offset + 0.13);
  });
}

/**
 * Play a gentle bell tone pulse
 */
function playGentleOnce(ctx: AudioContext, time: number) {
  const freqs = [440, 554.37]; // A4, C#5
  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time + idx * 0.12);

    gain.gain.setValueAtTime(0, time + idx * 0.12);
    gain.gain.linearRampToValueAtTime(0.2, time + idx * 0.12 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + idx * 0.12 + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time + idx * 0.12);
    osc.stop(time + idx * 0.12 + 0.85);
  });
}

/**
 * Plays a one-shot preview of the selected tone
 */
export function previewAlarmTone(tone: AlarmToneType = 'chime'): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  switch (tone) {
    case 'radar':
      playRadarOnce(ctx, now);
      break;
    case 'gentle':
      playGentleOnce(ctx, now);
      break;
    case 'chime':
    default:
      playChimeOnce(ctx, now);
      break;
  }
}

/**
 * Starts an in-app repeating alarm loop. Returns a stop() function.
 */
export function startAlarmLoop(tone: AlarmToneType = 'chime'): () => void {
  const ctx = getAudioContext();
  if (!ctx) return () => {};

  let isPlaying = true;
  let intervalId: any = null;

  const playStep = () => {
    if (!isPlaying) return;
    const now = ctx.currentTime;
    switch (tone) {
      case 'radar':
        playRadarOnce(ctx, now);
        break;
      case 'gentle':
        playGentleOnce(ctx, now);
        break;
      case 'chime':
      default:
        playChimeOnce(ctx, now);
        break;
    }
  };

  playStep();
  const stepInterval = tone === 'radar' ? 1200 : tone === 'gentle' ? 2000 : 1600;
  intervalId = setInterval(playStep, stepInterval);

  return () => {
    isPlaying = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}
