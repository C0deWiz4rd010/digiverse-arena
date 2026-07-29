/** Available neon themes. `cyber` is the default defined in _tokens.scss. */
export type ThemeId = 'cyber' | 'crimson' | 'emerald' | 'azure' | 'violet' | 'light';

/** Motion preference. `full` = all animations, `reduced` = essential only, `off` = none. */
export type MotionMode = 'full' | 'reduced' | 'off';

export interface AppSettings {
  theme: ThemeId;
  motion: MotionMode;
  sound: boolean;
  /** 0..1 master volume for UI sound effects. */
  soundVolume: number;
  haptics: boolean;
  /** Skip non-essential network work (large images, prefetch). */
  dataSaver: boolean;
  /** Drop expensive blur/glow effects for smoother low-end rendering. */
  reduceEffects: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'cyber',
  motion: 'full',
  sound: true,
  soundVolume: 0.6,
  haptics: true,
  dataSaver: false,
  reduceEffects: false,
};

export interface ThemeOption {
  id: ThemeId;
  label: string;
  hint: string;
  /** Two-stop gradient preview used in the picker swatch. */
  swatch: [string, string];
  /** Locked themes are unlocked via the shop; default themes are always free. */
  premium: boolean;
}

export const THEME_OPTIONS: readonly ThemeOption[] = [
  { id: 'cyber', label: 'Cyber Cyan', hint: 'The classic DigiVerse neon', swatch: ['#00e5ff', '#8b5cf6'], premium: false },
  { id: 'crimson', label: 'Virus Crimson', hint: 'Aggressive red overclock', swatch: ['#ff2d6b', '#ff8a3c'], premium: true },
  { id: 'emerald', label: 'Data Emerald', hint: 'Cool data-stream green', swatch: ['#17f0a0', '#12b6ff'], premium: true },
  { id: 'azure', label: 'Vaccine Azure', hint: 'Calm defensive blue', swatch: ['#3d9bff', '#7c5cff'], premium: true },
  { id: 'violet', label: 'Nightmare Violet', hint: 'Deep dusk purple', swatch: ['#a86bff', '#ff5cc4'], premium: true },
  { id: 'light', label: 'Light Circuit', hint: 'High-contrast daylight', swatch: ['#007ea8', '#6d3bff'], premium: true },
];

/** Themes that are always available without unlocking. */
export const FREE_THEMES: readonly ThemeId[] = ['cyber'];

export function isThemeId(value: unknown): value is ThemeId {
  return THEME_OPTIONS.some((option) => option.id === value);
}

export function normalizeSettings(input: Partial<AppSettings> | null | undefined): AppSettings {
  if (!input) return { ...DEFAULT_SETTINGS };
  return {
    theme: isThemeId(input.theme) ? input.theme : DEFAULT_SETTINGS.theme,
    motion:
      input.motion === 'reduced' || input.motion === 'off' || input.motion === 'full'
        ? input.motion
        : DEFAULT_SETTINGS.motion,
    sound: typeof input.sound === 'boolean' ? input.sound : DEFAULT_SETTINGS.sound,
    soundVolume:
      typeof input.soundVolume === 'number' && input.soundVolume >= 0 && input.soundVolume <= 1
        ? input.soundVolume
        : DEFAULT_SETTINGS.soundVolume,
    haptics: typeof input.haptics === 'boolean' ? input.haptics : DEFAULT_SETTINGS.haptics,
    dataSaver: typeof input.dataSaver === 'boolean' ? input.dataSaver : DEFAULT_SETTINGS.dataSaver,
    reduceEffects:
      typeof input.reduceEffects === 'boolean' ? input.reduceEffects : DEFAULT_SETTINGS.reduceEffects,
  };
}
