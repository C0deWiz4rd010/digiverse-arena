import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, achievementById, evaluateAchievements } from './achievements';
import type { CampaignFacts } from '../campaign/campaign-content';

const emptyFacts: CampaignFacts = {
  scans: 0,
  favorites: 0,
  teams: 0,
  battles: 0,
  tournaments: 0,
  notes: 0,
  miniGames: 0,
  rivals: 0,
  expeditions: 0,
  skillForges: 0,
  squadDrills: 0,
  scouterDuels: 0,
  masteryTotal: 0,
};

describe('achievements', () => {
  it('has unique ids', () => {
    const ids = new Set(ACHIEVEMENTS.map((a) => a.id));
    expect(ids.size).toBe(ACHIEVEMENTS.length);
  });

  it('locks everything for a fresh player', () => {
    const progress = evaluateAchievements(emptyFacts, { level: 1, streak: 0, lifetimeBits: 0 });
    expect(progress.every((entry) => !entry.unlocked)).toBe(true);
  });

  it('unlocks when a metric reaches its target', () => {
    const progress = evaluateAchievements(
      { ...emptyFacts, battles: 1 },
      { level: 1, streak: 0, lifetimeBits: 0 },
    );
    const firstBattle = progress.find((entry) => entry.def.id === 'battle-1');
    expect(firstBattle?.unlocked).toBe(true);
    expect(firstBattle?.ratio).toBe(1);
  });

  it('reports capped ratios for partial progress', () => {
    const progress = evaluateAchievements(
      { ...emptyFacts, scans: 5 },
      { level: 1, streak: 0, lifetimeBits: 0 },
    );
    const scan10 = progress.find((entry) => entry.def.id === 'scan-10');
    expect(scan10?.unlocked).toBe(false);
    expect(scan10?.ratio).toBeCloseTo(0.5);
  });

  it('uses player snapshot metrics (streak, level, lifetime bits)', () => {
    const progress = evaluateAchievements(emptyFacts, { level: 10, streak: 7, lifetimeBits: 1000 });
    expect(progress.find((e) => e.def.id === 'level-10')?.unlocked).toBe(true);
    expect(progress.find((e) => e.def.id === 'streak-7')?.unlocked).toBe(true);
    expect(progress.find((e) => e.def.id === 'bits-1000')?.unlocked).toBe(true);
  });

  it('looks up definitions by id', () => {
    expect(achievementById('battle-1')?.title).toBe('Into the Arena');
    expect(achievementById('nope')).toBeUndefined();
  });
});
