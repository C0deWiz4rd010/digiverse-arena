import { Injectable, computed, effect, signal } from '@angular/core';
import { digiDb } from '../cache/digi-db';
import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  type AppSettings,
  type MotionMode,
  type ThemeId,
} from './settings.model';

const STORAGE_KEY = 'digiverse-settings';
const DB_KEY = 'app';

/**
 * Central personalization store. Holds theme, motion, sound, haptics and performance
 * preferences as signals, mirrors them to localStorage (instant boot) and Dexie
 * (durable), and applies them to the document root so CSS can react.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly state = signal<AppSettings>(this.readFromStorage());

  readonly settings = this.state.asReadonly();
  readonly theme = computed(() => this.state().theme);
  readonly motion = computed(() => this.state().motion);
  readonly sound = computed(() => this.state().sound);
  readonly soundVolume = computed(() => this.state().soundVolume);
  readonly haptics = computed(() => this.state().haptics);
  readonly dataSaver = computed(() => this.state().dataSaver);
  readonly reduceEffects = computed(() => this.state().reduceEffects);

  constructor() {
    // Apply to <html> whenever settings change.
    effect(() => this.applyToDocument(this.state()));
    // Hydrate from Dexie after first paint (may override localStorage with the durable copy).
    void this.hydrateFromDb();
  }

  setTheme(theme: ThemeId): void {
    this.patch({ theme });
  }

  setMotion(motion: MotionMode): void {
    this.patch({ motion });
  }

  setSound(sound: boolean): void {
    this.patch({ sound });
  }

  setSoundVolume(soundVolume: number): void {
    this.patch({ soundVolume: Math.min(1, Math.max(0, soundVolume)) });
  }

  setHaptics(haptics: boolean): void {
    this.patch({ haptics });
  }

  setDataSaver(dataSaver: boolean): void {
    this.patch({ dataSaver });
  }

  setReduceEffects(reduceEffects: boolean): void {
    this.patch({ reduceEffects });
  }

  patch(partial: Partial<AppSettings>): void {
    const next = normalizeSettings({ ...this.state(), ...partial });
    this.state.set(next);
    this.persist(next);
  }

  reset(): void {
    this.state.set({ ...DEFAULT_SETTINGS });
    this.persist(DEFAULT_SETTINGS);
  }

  private patchSilent(next: AppSettings): void {
    this.state.set(next);
  }

  private readFromStorage(): AppSettings {
    try {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return normalizeSettings(JSON.parse(raw) as Partial<AppSettings>);
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  private persist(next: AppSettings): void {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage may be unavailable (private mode); ignore.
    }
    void digiDb.settings.put({ id: DB_KEY, value: next }).catch(() => undefined);
  }

  private async hydrateFromDb(): Promise<void> {
    try {
      const record = await digiDb.settings.get(DB_KEY);
      if (record?.value) {
        this.patchSilent(normalizeSettings(record.value as Partial<AppSettings>));
      }
    } catch {
      // Dexie unavailable; keep localStorage copy.
    }
  }

  private applyToDocument(settings: AppSettings): void {
    const root = globalThis.document?.documentElement;
    if (!root) return;
    root.setAttribute('data-theme', settings.theme);
    root.setAttribute('data-motion', settings.motion);
    root.setAttribute('data-fx', settings.reduceEffects || settings.dataSaver ? 'lite' : 'full');
  }
}
