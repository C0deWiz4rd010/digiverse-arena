import { Injectable, inject } from '@angular/core';
import { SettingsService } from '../settings/settings.service';

type Cue = 'tap' | 'select' | 'success' | 'error' | 'coin' | 'levelup' | 'reward';

interface Blip {
  freq: number;
  type: OscillatorType;
  duration: number;
  gain: number;
  /** Optional slide target frequency for a quick sweep. */
  slideTo?: number;
}

const CUES: Record<Cue, Blip[]> = {
  tap: [{ freq: 420, type: 'triangle', duration: 0.05, gain: 0.28 }],
  select: [{ freq: 640, type: 'square', duration: 0.06, gain: 0.24 }],
  success: [
    { freq: 660, type: 'triangle', duration: 0.09, gain: 0.3 },
    { freq: 990, type: 'triangle', duration: 0.12, gain: 0.3 },
  ],
  error: [{ freq: 180, type: 'sawtooth', duration: 0.16, gain: 0.26, slideTo: 120 }],
  coin: [
    { freq: 880, type: 'square', duration: 0.05, gain: 0.24 },
    { freq: 1320, type: 'square', duration: 0.08, gain: 0.22 },
  ],
  levelup: [
    { freq: 523, type: 'triangle', duration: 0.1, gain: 0.32 },
    { freq: 784, type: 'triangle', duration: 0.1, gain: 0.32 },
    { freq: 1046, type: 'triangle', duration: 0.16, gain: 0.34 },
  ],
  reward: [
    { freq: 740, type: 'triangle', duration: 0.08, gain: 0.28 },
    { freq: 1108, type: 'triangle', duration: 0.14, gain: 0.3 },
  ],
};

/**
 * Tiny synthesised UI sound effects — no audio assets, generated with WebAudio.
 * Every cue is gated by the user's sound setting and master volume. The AudioContext
 * is created lazily on the first cue (after a user gesture) to satisfy autoplay policies.
 */
@Injectable({ providedIn: 'root' })
export class SoundService {
  private readonly settings = inject(SettingsService);
  private ctx: AudioContext | null = null;

  play(cue: Cue): void {
    if (!this.settings.sound()) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);

    const volume = this.settings.soundVolume();
    let when = ctx.currentTime;
    for (const blip of CUES[cue]) {
      this.schedule(ctx, blip, when, volume);
      when += blip.duration * 0.85;
    }
  }

  tap(): void {
    this.play('tap');
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor =
      globalThis.AudioContext ??
      (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      this.ctx = new Ctor();
      return this.ctx;
    } catch {
      return null;
    }
  }

  private schedule(ctx: AudioContext, blip: Blip, when: number, volume: number): void {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = blip.type;
    osc.frequency.setValueAtTime(blip.freq, when);
    if (blip.slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, blip.slideTo), when + blip.duration);
    }
    const peak = blip.gain * volume;
    gainNode.gain.setValueAtTime(0.0001, when);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), when + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, when + blip.duration);
    osc.connect(gainNode).connect(ctx.destination);
    osc.start(when);
    osc.stop(when + blip.duration + 0.02);
  }
}
