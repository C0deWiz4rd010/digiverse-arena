import { describe, expect, it } from 'vitest';
import { rankFromXp, titleForLevel, xpForLevel, MAX_LEVEL } from './digirank';

describe('digirank', () => {
  it('starts everyone at level 1 with zero xp', () => {
    const rank = rankFromXp(0);
    expect(rank.level).toBe(1);
    expect(rank.xpIntoLevel).toBe(0);
    expect(rank.progress).toBe(0);
    expect(rank.title).toBe('Rookie Tamer');
  });

  it('advances a level once the required xp is reached', () => {
    const need = xpForLevel(1);
    const justBefore = rankFromXp(need - 1);
    const justAfter = rankFromXp(need);
    expect(justBefore.level).toBe(1);
    expect(justAfter.level).toBe(2);
    expect(justAfter.xpIntoLevel).toBe(0);
  });

  it('reports partial progress within a level', () => {
    const need = xpForLevel(1);
    const rank = rankFromXp(Math.floor(need / 2));
    expect(rank.level).toBe(1);
    expect(rank.progress).toBeGreaterThan(0);
    expect(rank.progress).toBeLessThan(1);
  });

  it('maps level brackets to titles', () => {
    expect(titleForLevel(1)).toBe('Rookie Tamer');
    expect(titleForLevel(10)).toBe('Silver Tamer');
    expect(titleForLevel(50)).toBe('DigiMaster');
  });

  it('clamps at the max level and never exceeds it', () => {
    const rank = rankFromXp(50_000_000);
    expect(rank.level).toBe(MAX_LEVEL);
    expect(rank.progress).toBe(1);
  });

  it('treats negative or invalid xp as zero', () => {
    expect(rankFromXp(-100).level).toBe(1);
    expect(rankFromXp(Number.NaN).totalXp).toBe(0);
  });
});
