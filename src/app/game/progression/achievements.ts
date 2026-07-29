import type { CampaignFacts } from '../campaign/campaign-content';

export type AchievementCategory =
  | 'explorer'
  | 'battler'
  | 'strategist'
  | 'collector'
  | 'dedication';

/** Player-level inputs that are not part of CampaignFacts. */
export interface AchievementPlayerSnapshot {
  level: number;
  streak: number;
  lifetimeBits: number;
}

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  icon: string;
  target: number;
  rewardBits: number;
  rewardTitle?: string;
  metric: (facts: CampaignFacts, player: AchievementPlayerSnapshot) => number;
}

export interface AchievementProgress {
  def: AchievementDef;
  current: number;
  target: number;
  ratio: number;
  unlocked: boolean;
}

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  explorer: 'Explorer',
  battler: 'Battler',
  strategist: 'Strategist',
  collector: 'Collector',
  dedication: 'Dedication',
};

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  // --- Explorer -------------------------------------------------------------
  { id: 'scan-10', category: 'explorer', title: 'First Contact', description: 'Scan 10 Digimon into your cache.', icon: '🔍', target: 10, rewardBits: 40, metric: (f) => f.scans },
  { id: 'scan-100', category: 'explorer', title: 'Field Researcher', description: 'Scan 100 Digimon.', icon: '🛰️', target: 100, rewardBits: 120, rewardTitle: 'Cartographer', metric: (f) => f.scans },
  { id: 'expedition-10', category: 'explorer', title: 'Pathfinder', description: 'Complete 10 field expeditions.', icon: '🧭', target: 10, rewardBits: 90, metric: (f) => f.expeditions },

  // --- Battler --------------------------------------------------------------
  { id: 'battle-1', category: 'battler', title: 'Into the Arena', description: 'Fight your first battle.', icon: '⚔️', target: 1, rewardBits: 30, metric: (f) => f.battles },
  { id: 'battle-25', category: 'battler', title: 'Arena Regular', description: 'Fight 25 battles.', icon: '🥊', target: 25, rewardBits: 100, metric: (f) => f.battles },
  { id: 'rival-5', category: 'battler', title: 'Rival Breaker', description: 'Defeat 5 rivals.', icon: '🎯', target: 5, rewardBits: 110, rewardTitle: 'Rival Breaker', metric: (f) => f.rivals },
  { id: 'tournament-3', category: 'battler', title: 'Bracket Buster', description: 'Win 3 tournaments.', icon: '🏆', target: 3, rewardBits: 160, metric: (f) => f.tournaments },

  // --- Strategist -----------------------------------------------------------
  { id: 'team-3', category: 'strategist', title: 'Squad Architect', description: 'Save 3 teams.', icon: '🛡️', target: 3, rewardBits: 60, metric: (f) => f.teams },
  { id: 'forge-10', category: 'strategist', title: 'Combo Smith', description: 'Land 10 skill-forge programs.', icon: '🔧', target: 10, rewardBits: 100, metric: (f) => f.skillForges },
  { id: 'scouter-15', category: 'strategist', title: 'Cold Reader', description: 'Play 15 scouter duels.', icon: '⚖️', target: 15, rewardBits: 90, metric: (f) => f.scouterDuels },
  { id: 'mastery-500', category: 'strategist', title: 'Core Overclock', description: 'Reach 500 total mastery.', icon: '🧠', target: 500, rewardBits: 200, rewardTitle: 'Nexus Adept', metric: (f) => f.masteryTotal },

  // --- Collector ------------------------------------------------------------
  { id: 'fav-10', category: 'collector', title: 'Curator', description: 'Favorite 10 Digimon.', icon: '⭐', target: 10, rewardBits: 50, metric: (f) => f.favorites },
  { id: 'note-10', category: 'collector', title: 'Analyst', description: 'Write 10 profile notes.', icon: '📝', target: 10, rewardBits: 60, metric: (f) => f.notes },
  { id: 'minigame-20', category: 'collector', title: 'Quiz Whiz', description: 'Win 20 mini-games.', icon: '🕹️', target: 20, rewardBits: 90, metric: (f) => f.miniGames },
  { id: 'bits-1000', category: 'collector', title: 'Bit Baron', description: 'Earn 1000 lifetime bits.', icon: '💠', target: 1000, rewardBits: 150, rewardTitle: 'Bit Baron', metric: (_f, p) => p.lifetimeBits },

  // --- Dedication -----------------------------------------------------------
  { id: 'streak-3', category: 'dedication', title: 'Warmed Up', description: 'Reach a 3-day login streak.', icon: '🔥', target: 3, rewardBits: 45, metric: (_f, p) => p.streak },
  { id: 'streak-7', category: 'dedication', title: 'Committed Tamer', description: 'Reach a 7-day login streak.', icon: '🔥', target: 7, rewardBits: 120, rewardTitle: 'Devoted Tamer', metric: (_f, p) => p.streak },
  { id: 'level-10', category: 'dedication', title: 'Rising Star', description: 'Reach DigiRank 10.', icon: '📈', target: 10, rewardBits: 100, metric: (_f, p) => p.level },
  { id: 'level-25', category: 'dedication', title: 'Veteran', description: 'Reach DigiRank 25.', icon: '🌟', target: 25, rewardBits: 250, rewardTitle: 'Veteran Tamer', metric: (_f, p) => p.level },
];

export function evaluateAchievements(
  facts: CampaignFacts,
  player: AchievementPlayerSnapshot,
): AchievementProgress[] {
  return ACHIEVEMENTS.map((def) => {
    const current = Math.max(0, Math.floor(def.metric(facts, player)));
    return {
      def,
      current,
      target: def.target,
      ratio: Math.min(1, current / def.target),
      unlocked: current >= def.target,
    };
  });
}

export function achievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((def) => def.id === id);
}
