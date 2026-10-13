import { AlarmType } from '../types';
import { loadSoundBlob } from './idb';

let audioCtx: AudioContext | null = null;
let customAudioEl: HTMLAudioElement | null = null;
let customAudioUrl: string | null = null;
let loopTimers: number[] = [];
let isRinging = false;
let onRingStateChange: ((ringing: boolean) => void) | null = null;

export function registerRingListener(listener: (ringing: boolean) => void) {
  onRingStateChange = listener;
}

export function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function tone(ctx: AudioContext, freq: number, t0: number, dur: number, vol: number, type: OscillatorType = 'sine') {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  } catch {
    // Ignore audio glitches
  }
}

function playSynthPattern(type: AlarmType, vol: number): number {
  const ctx = getAudioContext();
  if (!ctx) return 1;

  const t = ctx.currentTime;
  const scaledVol = Math.max(0.02, (vol / 100) * 0.45);

  if (type === 'bell') {
    const freqs: [number, number][] = [[880, 1], [1760, 0.45], [2640, 0.25], [3520, 0.12]];
    freqs.forEach(([f, k]) => tone(ctx, f, t, 1.8, scaledVol * k, 'sine'));
    return 2.2;
  }

  if (type === 'digital') {
    [0, 0.22, 0.44, 0.66].forEach(d => tone(ctx, 1000, t + d, 0.12, scaledVol * 0.7, 'square'));
    return 1.2;
  }

  if (type === 'rise') {
    [523, 659, 784, 1047].forEach((f, i) => tone(ctx, f, t + i * 0.2, 0.5, scaledVol, 'triangle'));
    return 1.4;
  }

  // Default 'chime'
  [660, 880, 990].forEach((f, i) => tone(ctx, f, t + i * 0.18, 0.26, scaledVol * 0.85, 'sine'));
  return 1.0;
}

export function stopAlarm() {
  loopTimers.forEach(id => clearTimeout(id));
  loopTimers = [];
  isRinging = false;
  if (onRingStateChange) onRingStateChange(false);

  if (customAudioEl) {
    try {
      customAudioEl.pause();
      customAudioEl.currentTime = 0;
    } catch {
      // ignore
    }
  }

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(0);
    } catch {
      // ignore
    }
  }
}

export async function primeAudioForPlayback() {
  getAudioContext();
  const soundData = await loadSoundBlob();
  if (soundData?.blob) {
    if (customAudioUrl) URL.revokeObjectURL(customAudioUrl);
    customAudioUrl = URL.createObjectURL(soundData.blob);
    if (!customAudioEl) {
      customAudioEl = new Audio();
    }
    customAudioEl.src = customAudioUrl;
    customAudioEl.muted = true;
    try {
      await customAudioEl.play();
      customAudioEl.pause();
      customAudioEl.muted = false;
    } catch {
      if (customAudioEl) customAudioEl.muted = false;
    }
  }
}

export async function triggerAlarm(
  alarmType: AlarmType,
  vol: number = 70,
  durationSec: number = 0, // 0 = once
  preview: boolean = false
): Promise<boolean> {
  stopAlarm();

  if (alarmType === 'none') {
    return false;
  }

  isRinging = true;
  if (onRingStateChange) onRingStateChange(true);

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200, 100, 400]);
    } catch {
      // ignore
    }
  }

  let synthType: AlarmType = alarmType;
  if (alarmType === 'custom') {
    const soundData = await loadSoundBlob();
    if (soundData?.blob) {
      if (customAudioUrl) URL.revokeObjectURL(customAudioUrl);
      customAudioUrl = URL.createObjectURL(soundData.blob);
      if (!customAudioEl) customAudioEl = new Audio();
      customAudioEl.src = customAudioUrl;
      customAudioEl.volume = Math.max(0.05, Math.min(1, vol / 100));
      customAudioEl.loop = durationSec > 0;
      customAudioEl.onended = () => {
        if (!customAudioEl?.loop) stopAlarm();
      };

      try {
        await customAudioEl.play();
        if (durationSec > 0) {
          const tid = window.setTimeout(stopAlarm, durationSec * 1000);
          loopTimers.push(tid);
        }
        return true;
      } catch (err) {
        console.warn('Audio playback error', err);
        playSynthPattern('chime', vol);
        return false;
      }
    } else {
      synthType = 'chime';
    }
  }

  const effectiveType = synthType === 'custom' ? 'chime' : synthType;
  const durMs = durationSec * 1000;
  const stopAt = durMs > 0 ? Date.now() + durMs : 0;

  const runLoop = () => {
    if (!isRinging) return;
    const patternSec = playSynthPattern(effectiveType, vol);
    const patternMs = patternSec * 1000;

    if (stopAt > 0 && Date.now() + patternMs < stopAt) {
      const tid = window.setTimeout(runLoop, patternMs + 350);
      loopTimers.push(tid);
    } else if (stopAt > 0) {
      const tid = window.setTimeout(stopAlarm, patternMs + 100);
      loopTimers.push(tid);
    } else {
      // Played once
      const tid = window.setTimeout(stopAlarm, patternMs + 100);
      loopTimers.push(tid);
    }
  };

  runLoop();
  return true;
}

export function getIsAlarmRinging(): boolean {
  return isRinging;
}
