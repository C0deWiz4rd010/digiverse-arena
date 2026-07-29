import { Injectable, inject } from '@angular/core';
import { SettingsService } from '../settings/settings.service';

type HapticPattern = 'tap' | 'select' | 'success' | 'error' | 'reward' | 'levelup';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 10,
  select: 15,
  success: [12, 40, 18],
  error: [30, 30, 30],
  reward: [10, 30, 10, 30, 24],
  levelup: [16, 40, 16, 40, 40],
};

/**
 * Thin wrapper around the Vibration API, gated by the user's haptics setting.
 * No-ops silently on devices/browsers without vibration support (desktop, iOS Safari).
 */
@Injectable({ providedIn: 'root' })
export class HapticsService {
  private readonly settings = inject(SettingsService);

  vibrate(pattern: HapticPattern): void {
    if (!this.settings.haptics()) return;
    const nav = globalThis.navigator;
    if (!nav || typeof nav.vibrate !== 'function') return;
    try {
      nav.vibrate(PATTERNS[pattern]);
    } catch {
      // Ignore — vibration is best-effort.
    }
  }

  tap(): void {
    this.vibrate('tap');
  }
}
