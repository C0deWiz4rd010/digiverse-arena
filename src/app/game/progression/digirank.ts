/**
 * DigiRank — the tamer's overall level derived from accumulated XP.
 * XP is earned across every mode (bits, quest claims, battle wins, achievements).
 * Pure, deterministic math so it is trivially testable.
 */

export interface RankInfo {
  /** 1-indexed tamer level. */
  level: number;
  title: string;
  /** XP accumulated within the current level. */
  xpIntoLevel: number;
  /** XP required to advance from the current level to the next. */
  xpForLevel: number;
  /** 0..1 progress toward the next level. */
  progress: number;
  totalXp: number;
}

interface RankTitle {
  minLevel: number;
  title: string;
}

export const RANK_TITLES: readonly RankTitle[] = [
  { minLevel: 1, title: 'Rookie Tamer' },
  { minLevel: 5, title: 'Bronze Tamer' },
  { minLevel: 10, title: 'Silver Tamer' },
  { minLevel: 15, title: 'Gold Tamer' },
  { minLevel: 20, title: 'Platinum Tamer' },
  { minLevel: 30, title: 'Nexus Adept' },
  { minLevel: 40, title: 'Nexus Elite' },
  { minLevel: 50, title: 'DigiMaster' },
];

export const MAX_LEVEL = 99;

/** XP required to advance from `level` to `level + 1`. Grows gently and linearly. */
export function xpForLevel(level: number): number {
  const clamped = Math.max(1, Math.floor(level));
  return 80 + clamped * 45;
}

export function titleForLevel(level: number): string {
  let title = RANK_TITLES[0].title;
  for (const entry of RANK_TITLES) {
    if (level >= entry.minLevel) title = entry.title;
  }
  return title;
}

export function rankFromXp(totalXp: number): RankInfo {
  const safeXp = Math.max(0, Math.floor(totalXp || 0));
  let level = 1;
  let remaining = safeXp;
  while (level < MAX_LEVEL && remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }
  const need = xpForLevel(level);
  return {
    level,
    title: titleForLevel(level),
    xpIntoLevel: remaining,
    xpForLevel: need,
    progress: level >= MAX_LEVEL ? 1 : Math.min(1, remaining / need),
    totalXp: safeXp,
  };
}
