import type { ThemeId } from '../settings/settings.model';

/** The tamer's persistent identity, wallet and progression state. */
export interface PlayerProfile {
  tamerName: string;
  /** Deterministic seed used to render the tamer avatar. */
  avatarSeed: number;
  /** Chosen partner Digimon id, or null if none picked yet. */
  partnerId: number | null;
  partnerName: string;
  /** Currently equipped title (from achievements/shop). */
  title: string;
  /** Currently equipped profile banner id. */
  banner: string;
  /** Spendable currency. */
  bits: number;
  /** Total bits ever earned (never decreases) — drives some achievements. */
  lifetimeBits: number;
  /** Accumulated DigiRank XP. */
  xp: number;
  /** Consecutive-day login streak. */
  streak: number;
  /** dayIndex of the last recorded login. */
  lastActiveDay: number;
  /** Whether the onboarding flow has been completed or skipped. */
  onboarded: boolean;
  unlockedThemes: ThemeId[];
  unlockedCosmetics: string[];
  unlockedTitles: string[];
  createdAt: number;
  updatedAt: number;
}

export function defaultPlayerProfile(): PlayerProfile {
  const now = Date.now();
  return {
    tamerName: 'Guest Tamer',
    avatarSeed: Math.floor(Math.random() * 1_000_000),
    partnerId: null,
    partnerName: '',
    title: 'Rookie Tamer',
    banner: 'default',
    bits: 0,
    lifetimeBits: 0,
    xp: 0,
    streak: 0,
    lastActiveDay: -1,
    onboarded: false,
    unlockedThemes: ['cyber'],
    unlockedCosmetics: [],
    unlockedTitles: ['Rookie Tamer'],
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizePlayerProfile(input: Partial<PlayerProfile> | null | undefined): PlayerProfile {
  const base = defaultPlayerProfile();
  if (!input) return base;
  return {
    ...base,
    ...input,
    unlockedThemes: Array.isArray(input.unlockedThemes) ? input.unlockedThemes : base.unlockedThemes,
    unlockedCosmetics: Array.isArray(input.unlockedCosmetics)
      ? input.unlockedCosmetics
      : base.unlockedCosmetics,
    unlockedTitles: Array.isArray(input.unlockedTitles) ? input.unlockedTitles : base.unlockedTitles,
  };
}
