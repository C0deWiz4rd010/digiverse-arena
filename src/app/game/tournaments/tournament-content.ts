import type { Digimon } from '../../core/models/digimon';
import { battleSummary, simulateBattle, type BattleResult } from '../battle-engine/battle-engine';
import type { MasteryTrack } from '../mastery/digicore-mastery';
import { analyzeDigiLink, combatTuningFromProfile } from '../nexus/digilink-nexus';
import { deriveStats, statTotal } from '../stats/battle-stats';

export type TournamentStrategyId = 'balanced' | 'crowd-roar' | 'counter-scout' | 'prize-hunt' | 'overdrive';

export interface TournamentStrategy {
  id: TournamentStrategyId;
  label: string;
  shortLabel: string;
  stance: string;
  description: string;
  upside: string;
  risk: string;
  hypeBonus: number;
  rewardBonus: number;
  safetyBonus: number;
  chaosBonus: number;
  masteryTrack: MasteryTrack;
}

export interface TournamentDefinition {
  id: string;
  name: string;
  tagline: string;
  format: 'boss-rush' | 'gauntlet' | 'single-elimination' | 'survival';
  size: 4 | 8 | 16;
  teamSize: number;
  field: string | null;
  seedIds: number[];
  description: string;
  rule: string;
  reward: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  modifiers: string[];
  sponsor: string;
}

export interface TournamentMatch {
  id: string;
  round: number;
  slot: number;
  playerName: string;
  enemyName: string;
  winnerName: string | null;
  result: BattleResult | null;
  leftPower: number;
  rightPower: number;
  winnerPower: number;
  loserPower: number;
  hype: number;
  margin: number;
  upset: boolean;
  headline: string;
  rewardBits: number;
  dramaTags: string[];
  swing: number;
  playerInvolved: boolean;
}

export interface TournamentContender {
  id: string;
  name: string;
  leadName: string;
  player: boolean;
  power: number;
  seedRank: number;
  teamIds: number[];
  crest: string;
  leadImage: string | null;
}

export interface TournamentStoryBeat {
  round: number;
  title: string;
  detail: string;
  intensity: number;
}

export interface TournamentPhase {
  round: number;
  label: string;
  summary: string;
  highestHype: number;
  winners: string[];
  playerAlive: boolean;
  shock: boolean;
}

export interface TournamentMoment {
  id: string;
  kind: 'opening' | 'rival' | 'upset' | 'clutch' | 'sponsor' | 'final' | 'reward' | 'glitch';
  round: number;
  title: string;
  detail: string;
  intensity: number;
  tone: 'cool' | 'hot' | 'danger' | 'success';
  matchId?: string;
}

export interface TournamentRewardOption {
  id: string;
  title: string;
  track: MasteryTrack;
  amount: number;
  description: string;
  rarity: 'standard' | 'rare' | 'legend';
}

export interface TournamentRun {
  id: string;
  definition: TournamentDefinition;
  status: 'active' | 'complete';
  championName: string | null;
  matches: TournamentMatch[];
  contenders: TournamentContender[];
  storyBeats: TournamentStoryBeat[];
  phases: TournamentPhase[];
  moments: TournamentMoment[];
  rewardOptions: TournamentRewardOption[];
  strategy: TournamentStrategy;
  finalHeadline: string;
  hypeScore: number;
  upsetCount: number;
  momentum: number;
  totalRewardBits: number;
  rivalName: string | null;
  crowdMood: string;
  spotlightMatchId: string | null;
  playerPlacement: string;
  rewardSummary: string;
}

export const TOURNAMENT_STRATEGIES: TournamentStrategy[] = [
  {
    id: 'balanced',
    label: 'Balanced Circuit',
    shortLabel: 'Balanced',
    stance: 'Stable reads, clean rewards.',
    description: 'Default tournament stance with reliable tempo and no sharp downside.',
    upside: 'Keeps the bracket predictable.',
    risk: 'No explosive bonus.',
    hypeBonus: 0,
    rewardBonus: 0,
    safetyBonus: 0,
    chaosBonus: 0,
    masteryTrack: 'tactics',
  },
  {
    id: 'crowd-roar',
    label: 'Crowd Roar',
    shortLabel: 'Roar',
    stance: 'Make every hit louder.',
    description: 'Leans into flashy finals, crit pressure and high-intensity broadcast moments.',
    upside: '+hype and a small crit lift for your team.',
    risk: 'Close losses still become very loud.',
    hypeBonus: 10,
    rewardBonus: 0.08,
    safetyBonus: 0,
    chaosBonus: 4,
    masteryTrack: 'arena',
  },
  {
    id: 'counter-scout',
    label: 'Counter Scout',
    shortLabel: 'Scout',
    stance: 'Read the bracket before it bites.',
    description: 'Trades spectacle for better defensive reads and cleaner upset control.',
    upside: '+guard stability for your team.',
    risk: 'Lower crowd spike.',
    hypeBonus: -2,
    rewardBonus: 0.04,
    safetyBonus: 12,
    chaosBonus: -4,
    masteryTrack: 'scan',
  },
  {
    id: 'prize-hunt',
    label: 'Prize Hunt',
    shortLabel: 'Prize',
    stance: 'Route the bracket for loot.',
    description: 'Squeezes more bits and a stronger reward draft out of each round.',
    upside: '+reward bits and stronger mastery payout.',
    risk: 'Less combat help.',
    hypeBonus: 2,
    rewardBonus: 0.22,
    safetyBonus: 0,
    chaosBonus: 1,
    masteryTrack: 'tactics',
  },
  {
    id: 'overdrive',
    label: 'Nexus Overdrive',
    shortLabel: 'Overdrive',
    stance: 'Break the bracket open.',
    description: 'A risky power route that boosts damage, spectacle and glitch surprises.',
    upside: '+damage pressure and maximum hype.',
    risk: 'More volatile story moments.',
    hypeBonus: 15,
    rewardBonus: 0.14,
    safetyBonus: -8,
    chaosBonus: 14,
    masteryTrack: 'skill',
  },
];

export const TOURNAMENTS: TournamentDefinition[] = [
  {
    id: 'rookie-cup',
    name: 'Rookie Cup',
    tagline: 'Small bracket, huge first victory energy.',
    format: 'single-elimination',
    size: 4,
    teamSize: 1,
    field: null,
    seedIds: [1, 2, 3, 4, 5, 6],
    description: 'A readable tutorial bracket focused on basic command timing.',
    rule: 'Solo teams, no special field.',
    reward: 'Rookie Crest Badge',
    difficulty: 1,
    modifiers: ['Clean bracket', 'Low pressure', 'Fast rematches'],
    sponsor: 'Beginner Gate',
  },
  {
    id: 'virus-cup',
    name: 'Virus Cup',
    tagline: 'Aggro bracket where counters and guts matter.',
    format: 'survival',
    size: 8,
    teamSize: 2,
    field: 'Nightmare Soldiers',
    seedIds: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 31, 32, 33, 34, 35, 36],
    description: 'Aggressive matchups where attribute counters matter.',
    rule: 'Virus-heavy AI lineups and higher crit pressure.',
    reward: 'Redline Counter Chip',
    difficulty: 3,
    modifiers: ['Crit heat +', 'Dark Field', 'Comeback bonus'],
    sponsor: 'Redline Coliseum',
  },
  {
    id: 'field-masters',
    name: 'Field Masters',
    tagline: 'A full-field strategy festival for cohesive teams.',
    format: 'single-elimination',
    size: 8,
    teamSize: 3,
    field: 'Nature Spirits',
    seedIds: [21, 22, 23, 24, 25, 26, 27, 28, 41, 42, 43, 44, 45, 46, 47, 48, 61, 62, 63, 64, 65],
    description: 'Field cohesion tournament with meaningful affinity bonuses.',
    rule: 'Field bonus active in every round.',
    reward: 'Biome Master Key',
    difficulty: 3,
    modifiers: ['Field affinity +10%', 'Team cohesion scoring', 'Biome spotlight'],
    sponsor: 'Cartographer Guild',
  },
  {
    id: 'x-antibody-invitational',
    name: 'X-Antibody Invitational',
    tagline: 'High-tier invite-only spectacle with brutal finals.',
    format: 'boss-rush',
    size: 4,
    teamSize: 3,
    field: 'Metal Empire',
    seedIds: [243, 244, 245, 246, 247, 248, 249, 250, 251],
    description: 'A compact high-power bracket for late-game builds.',
    rule: 'High-tier seeds, shorter bracket, bigger rewards.',
    reward: 'X-Core Invite Seal',
    difficulty: 5,
    modifiers: ['Elite seeds', 'High technique pressure', 'Final boss aura'],
    sponsor: 'X-Core Council',
  },
  {
    id: 'legendary-clash',
    name: 'Legendary Clash',
    tagline: 'A prestige bracket with cinematic underdog potential.',
    format: 'single-elimination',
    size: 8,
    teamSize: 3,
    field: 'Deep Savers',
    seedIds: [101, 102, 103, 104, 105, 106, 107, 108, 121, 122, 123, 124, 125, 126, 127, 128, 141, 142, 143, 144, 145],
    description: 'Big names, swingy matchups and a reward tuned for collectors.',
    rule: 'Final round adds extra hype and reward bits.',
    reward: 'Legend Circuit Crown',
    difficulty: 4,
    modifiers: ['Prestige seeds', 'Final hype x2', 'Collector reward'],
    sponsor: 'Legend Circuit',
  },
  {
    id: 'random-chaos-league',
    name: 'Random Chaos League',
    tagline: 'Sixteen seeds, rapid chaos, absurd bracket stories.',
    format: 'gauntlet',
    size: 16,
    teamSize: 1,
    field: null,
    seedIds: [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 51, 52, 53, 54, 55, 56, 57],
    description: 'A huge one-member bracket for strange pairings and surprise champions.',
    rule: 'Every matchup is volatile and upset hype is amplified.',
    reward: 'Chaos League Banner',
    difficulty: 2,
    modifiers: ['16 seed sprint', 'Upset hype +', 'No field safety net'],
    sponsor: 'DigiVerse Afterhours',
  },
];

export function tournamentDefinition(id: string): TournamentDefinition {
  return TOURNAMENTS.find((tournament) => tournament.id === id) ?? TOURNAMENTS[0];
}

export function tournamentStrategy(id: TournamentStrategyId): TournamentStrategy {
  return TOURNAMENT_STRATEGIES.find((strategy) => strategy.id === id) ?? TOURNAMENT_STRATEGIES[0];
}

export function runTournament(
  definition: TournamentDefinition,
  playerTeam: Digimon[],
  opponents: Digimon[],
  strategyId: TournamentStrategyId = 'balanced',
): TournamentRun {
  const strategy = tournamentStrategy(strategyId);
  const matches: TournamentMatch[] = [];
  const contendersSnapshot = createContenders(definition, playerTeam, opponents);
  const rival = contendersSnapshot.filter((contender) => !contender.player).sort((a, b) => b.power - a.power)[0] ?? null;
  let round = 1;
  let contenders = contendersSnapshot.map((contender) => ({
    ...contender,
    team: contender.player ? playerTeam : teamFromIds(opponents, contender.teamIds),
  }));

  while (contenders.length > 1) {
    const winners: typeof contenders = [];
    for (let i = 0; i < contenders.length; i += 2) {
      const left = contenders[i];
      const right = contenders[i + 1] ?? contenders[i];
      const result = simulateBattle(left.team, right.team, {
        mode: definition.id,
        arenaField: definition.field,
        seed: definition.seedIds[0] + round * 101 + i + strategySeedOffset(strategy),
        playerNexus: tuneForStrategy(combatTuningFromProfile(analyzeDigiLink(left.team)), strategy, left.player),
        enemyNexus: tuneForStrategy(combatTuningFromProfile(analyzeDigiLink(right.team)), strategy, right.player),
      });
      const leftWins = result.winner === 'player' || (result.winner === 'draw' && left.power >= right.power);
      const winner = leftWins ? left : right;
      const loser = leftWins ? right : left;
      const margin = matchMargin(result, leftWins);
      const playerInvolved = left.player || right.player;
      const upset = winner.power + 35 + strategy.safetyBonus < loser.power;
      const hype = matchHype(definition, result, round, margin, upset, contenders.length === 2, strategy, playerInvolved);
      const swing = Math.round(Math.abs(left.power - right.power) + Math.abs(margin) + (upset ? 20 : 0));
      winners.push(winner);
      matches.push({
        id: `${definition.id}-r${round}-m${i / 2}`,
        round,
        slot: i / 2,
        playerName: left.name,
        enemyName: right.name,
        winnerName: winner.name,
        result,
        leftPower: left.power,
        rightPower: right.power,
        winnerPower: winner.power,
        loserPower: loser.power,
        hype,
        margin,
        upset,
        headline: matchHeadline(definition, winner.name, loser.name, round, upset, margin, contenders.length === 2),
        rewardBits: rewardBits(definition, round, hype, upset, strategy, playerInvolved),
        dramaTags: matchDramaTags(definition, result, margin, upset, contenders.length === 2, playerInvolved, strategy),
        swing,
        playerInvolved,
      });
    }
    contenders = winners;
    round += 1;
  }

  const championName = contenders[0]?.name ?? null;
  const phases = createPhases(matches);
  const moments = createMoments(definition, matches, championName, strategy, rival?.name ?? null);
  const storyBeats = createStoryBeats(definition, matches, championName, moments);
  const final = matches[matches.length - 1];
  const hypeScore = Math.round(matches.reduce((sum, match) => sum + match.hype, 0) / Math.max(1, matches.length));
  const upsetCount = matches.filter((match) => match.upset).length;
  const totalRewardBits = matches.reduce((sum, match) => sum + match.rewardBits, 0);
  const momentum = Math.min(100, Math.max(0, Math.round(hypeScore + upsetCount * 7 + strategy.hypeBonus)));

  return {
    id: `${definition.id}-${Date.now()}`,
    definition,
    status: 'complete',
    championName,
    matches,
    contenders: contendersSnapshot,
    storyBeats,
    phases,
    moments,
    rewardOptions: createRewardOptions(definition, strategy, hypeScore, totalRewardBits),
    strategy,
    finalHeadline: final?.headline ?? 'No final was resolved.',
    hypeScore,
    upsetCount,
    momentum,
    totalRewardBits,
    rivalName: rival?.name ?? null,
    crowdMood: crowdMood(hypeScore, upsetCount, strategy),
    spotlightMatchId: final?.id ?? null,
    playerPlacement: playerPlacement(matches),
    rewardSummary: `${definition.reward} + ${totalRewardBits} bits`,
  };
}

export function tournamentSummary(run: TournamentRun): string {
  const final = run.matches[run.matches.length - 1];
  return final?.result
    ? `${run.finalHeadline} ${battleSummary(final.result)} Hype ${run.hypeScore}.`
    : 'Tournament has no resolved final yet.';
}

function createContenders(
  definition: TournamentDefinition,
  playerTeam: Digimon[],
  opponents: Digimon[],
): TournamentContender[] {
  const opponentPool = opponents.length ? opponents : playerTeam;
  const contenders: TournamentContender[] = [
    {
      id: 'player',
      name: 'Your Team',
      leadName: playerTeam[0]?.name ?? 'Your Lead',
      player: true,
      power: teamPower(playerTeam),
      seedRank: 1,
      teamIds: playerTeam.map((digimon) => digimon.id),
      crest: 'Player Crest',
      leadImage: playerTeam[0]?.image ?? null,
    },
  ];

  for (let i = 0; i < definition.size - 1; i += 1) {
    const team = Array.from({ length: definition.teamSize }, (_, slot) => {
      const index = (i * definition.teamSize + slot) % Math.max(1, opponentPool.length);
      return opponentPool[index];
    }).filter(Boolean);
    const lead = team[0];
    contenders.push({
      id: `${definition.id}-seed-${i + 1}`,
      name: `${seedTitle(definition, i)} ${lead?.name ?? 'Unknown'}`,
      leadName: lead?.name ?? 'Unknown',
      player: false,
      power: teamPower(team),
      seedRank: i + 2,
      teamIds: team.map((digimon) => digimon.id),
      crest: seedCrest(definition, i),
      leadImage: lead?.image ?? null,
    });
  }

  return contenders.sort((a, b) => (a.player ? -1 : b.player ? 1 : b.power - a.power));
}

function teamFromIds(pool: Digimon[], ids: number[]): Digimon[] {
  const byId = new Map(pool.map((digimon) => [digimon.id, digimon]));
  return ids.flatMap((id) => {
    const found = byId.get(id);
    return found ? [found] : [];
  });
}

function teamPower(team: Digimon[]): number {
  if (!team.length) return 0;
  return Math.round(team.reduce((sum, digimon) => sum + statTotal(deriveStats(digimon)), 0) / team.length);
}

function strategySeedOffset(strategy: TournamentStrategy): number {
  return TOURNAMENT_STRATEGIES.findIndex((item) => item.id === strategy.id) * 997;
}

function tuneForStrategy(
  tuning: ReturnType<typeof combatTuningFromProfile>,
  strategy: TournamentStrategy,
  playerOwned: boolean,
): ReturnType<typeof combatTuningFromProfile> {
  if (!playerOwned) return tuning;
  if (strategy.id === 'crowd-roar') {
    return { ...tuning, critBonus: Number((tuning.critBonus + 0.018).toFixed(3)), focusStart: tuning.focusStart + 1 };
  }
  if (strategy.id === 'counter-scout') {
    return { ...tuning, guardChance: Number((tuning.guardChance + 0.04).toFixed(3)), focusStart: tuning.focusStart + 1 };
  }
  if (strategy.id === 'overdrive') {
    return {
      ...tuning,
      critBonus: Number((tuning.critBonus + 0.012).toFixed(3)),
      damageModifier: Number((tuning.damageModifier + 0.045).toFixed(3)),
    };
  }
  return tuning;
}

function matchMargin(result: BattleResult, leftWins: boolean): number {
  const winnerTeam = leftWins ? result.player : result.enemy;
  const loserTeam = leftWins ? result.enemy : result.player;
  const winnerHp = winnerTeam.reduce((sum, combatant) => sum + combatant.hp, 0);
  const loserHp = loserTeam.reduce((sum, combatant) => sum + combatant.hp, 0);
  const totalHp = [...winnerTeam, ...loserTeam].reduce((sum, combatant) => sum + combatant.maxHp, 0);
  return Math.max(1, Math.round(((winnerHp - loserHp) / Math.max(1, totalHp)) * 100));
}

function matchHype(
  definition: TournamentDefinition,
  result: BattleResult,
  round: number,
  margin: number,
  upset: boolean,
  final: boolean,
  strategy: TournamentStrategy,
  playerInvolved: boolean,
): number {
  const criticals = result.events.filter((event) => event.type === 'damage' && event.critical).length;
  const kos = result.events.filter((event) => event.type === 'ko').length;
  const closeness = Math.max(0, 30 - Math.abs(margin));
  const formatBoost = definition.format === 'gauntlet' ? 7 : definition.format === 'boss-rush' ? 12 : 0;
  const playerBoost = playerInvolved ? 8 : 0;
  return Math.min(
    100,
    30 +
      definition.difficulty * 6 +
      round * 5 +
      criticals * 4 +
      kos * 5 +
      closeness +
      (upset ? 18 : 0) +
      (final ? 16 : 0) +
      formatBoost +
      playerBoost +
      strategy.hypeBonus,
  );
}

function rewardBits(
  definition: TournamentDefinition,
  round: number,
  hype: number,
  upset: boolean,
  strategy: TournamentStrategy,
  playerInvolved: boolean,
): number {
  const base = definition.difficulty * 8 + round * 5 + hype / 4 + (upset ? 12 : 0) + (playerInvolved ? 6 : 0);
  return Math.round(base * (1 + strategy.rewardBonus));
}

function matchHeadline(
  definition: TournamentDefinition,
  winner: string,
  loser: string,
  round: number,
  upset: boolean,
  margin: number,
  final: boolean,
): string {
  if (final) return `${winner} claims ${definition.name} in a signature final.`;
  if (upset) return `${winner} shocks ${loser} with an upset run.`;
  if (Math.abs(margin) < 9) return `${winner} survives a razor-close Round ${round}.`;
  return `${winner} advances past ${loser}.`;
}

function matchDramaTags(
  definition: TournamentDefinition,
  result: BattleResult,
  margin: number,
  upset: boolean,
  final: boolean,
  playerInvolved: boolean,
  strategy: TournamentStrategy,
): string[] {
  const criticals = result.events.filter((event) => event.type === 'damage' && event.critical).length;
  const kos = result.events.filter((event) => event.type === 'ko').length;
  return [
    ...(playerInvolved ? ['your run'] : []),
    ...(upset ? ['upset alarm'] : []),
    ...(Math.abs(margin) < 9 ? ['photo finish'] : []),
    ...(criticals >= 2 ? ['crit storm'] : []),
    ...(kos >= definition.teamSize ? ['ko chain'] : []),
    ...(final ? ['final theater'] : []),
    ...(strategy.id === 'overdrive' ? ['overdrive'] : []),
  ].slice(0, 4);
}

function createPhases(matches: TournamentMatch[]): TournamentPhase[] {
  const rounds = [...new Set(matches.map((match) => match.round))];
  let playerStillAlive = true;
  return rounds.map((round) => {
    const roundMatches = matches.filter((match) => match.round === round);
    const highest = [...roundMatches].sort((a, b) => b.hype - a.hype)[0];
    if (
      roundMatches.some(
        (match) =>
          match.playerInvolved && match.winnerName !== 'Your Team' && (match.playerName === 'Your Team' || match.enemyName === 'Your Team'),
      )
    ) {
      playerStillAlive = false;
    }
    return {
      round,
      label: round === rounds.length ? 'Final Gate' : round === 1 ? 'Opening Gate' : `Round ${round}`,
      summary: highest?.headline ?? `Round ${round} is waiting for broadcast data.`,
      highestHype: highest?.hype ?? 0,
      winners: roundMatches.flatMap((match) => (match.winnerName ? [match.winnerName] : [])),
      playerAlive: playerStillAlive,
      shock: roundMatches.some((match) => match.upset || match.dramaTags.includes('photo finish')),
    };
  });
}

function createMoments(
  definition: TournamentDefinition,
  matches: TournamentMatch[],
  championName: string | null,
  strategy: TournamentStrategy,
  rivalName: string | null,
): TournamentMoment[] {
  const final = matches[matches.length - 1];
  const biggestUpset = [...matches].sort((a, b) => Number(b.upset) - Number(a.upset) || b.hype - a.hype)[0];
  const clutch = [...matches]
    .filter((match) => Math.abs(match.margin) < 10)
    .sort((a, b) => b.hype - a.hype)[0];
  const sponsorMatch = [...matches].sort((a, b) => b.rewardBits - a.rewardBits)[0];
  return [
    {
      id: 'opening',
      kind: 'opening',
      round: 0,
      title: `${definition.sponsor} lights the circuit`,
      detail: `${strategy.label} locked. ${strategy.stance}`,
      intensity: Math.max(35, 45 + strategy.hypeBonus),
      tone: 'cool',
    },
    ...(rivalName
      ? [
          {
            id: 'rival',
            kind: 'rival' as const,
            round: 1,
            title: 'Rival signal found',
            detail: `${rivalName} enters as the power target. Watch the bracket path.`,
            intensity: 62,
            tone: 'danger' as const,
          },
        ]
      : []),
    ...(biggestUpset?.upset
      ? [
          {
            id: 'upset',
            kind: 'upset' as const,
            round: biggestUpset.round,
            title: 'Upset shockwave',
            detail: biggestUpset.headline,
            intensity: biggestUpset.hype,
            tone: 'hot' as const,
            matchId: biggestUpset.id,
          },
        ]
      : []),
    ...(clutch
      ? [
          {
            id: 'clutch',
            kind: 'clutch' as const,
            round: clutch.round,
            title: 'Photo-finish window',
            detail: `${clutch.winnerName} escapes with a ${Math.abs(clutch.margin)} margin swing.`,
            intensity: clutch.hype,
            tone: 'success' as const,
            matchId: clutch.id,
          },
        ]
      : []),
    ...(strategy.chaosBonus >= 10
      ? [
          {
            id: 'glitch',
            kind: 'glitch' as const,
            round: Math.max(1, Math.floor((final?.round ?? 1) / 2)),
            title: 'Nexus glitch surge',
            detail: 'Overdrive bends the broadcast feed. Rewards climb, but every close hit feels dangerous.',
            intensity: Math.min(100, 70 + strategy.chaosBonus),
            tone: 'danger' as const,
          },
        ]
      : []),
    {
      id: 'sponsor',
      kind: 'sponsor',
      round: sponsorMatch?.round ?? 1,
      title: 'Sponsor bounty spiked',
      detail: sponsorMatch ? `${sponsorMatch.rewardBits} bits ride on ${sponsorMatch.headline}` : 'Reward data is warming up.',
      intensity: Math.min(100, sponsorMatch?.rewardBits ?? 40),
      tone: 'hot',
      matchId: sponsorMatch?.id,
    },
    {
      id: 'final',
      kind: 'final',
      round: final?.round ?? 0,
      title: championName ? `${championName} takes the broadcast` : 'Final unresolved',
      detail: final?.headline ?? 'No final result was generated.',
      intensity: final?.hype ?? 0,
      tone: 'success',
      matchId: final?.id,
    },
    {
      id: 'reward',
      kind: 'reward',
      round: final?.round ?? 0,
      title: 'Reward draft online',
      detail: 'Choose one payout route to push your local DigiCore mastery.',
      intensity: Math.min(100, 50 + strategy.rewardBonus * 120),
      tone: 'cool',
    },
  ];
}

function createStoryBeats(
  definition: TournamentDefinition,
  matches: TournamentMatch[],
  championName: string | null,
  moments: TournamentMoment[],
): TournamentStoryBeat[] {
  const openingHype = Math.max(...matches.filter((match) => match.round === 1).map((match) => match.hype), 0);
  const biggestUpset = [...matches].sort((a, b) => Number(b.upset) - Number(a.upset) || b.hype - a.hype)[0];
  const final = matches[matches.length - 1];
  const legacyBeats = [
    {
      round: 0,
      title: `${definition.sponsor} opens the gates`,
      detail: `${definition.tagline} Modifiers active: ${definition.modifiers.join(', ')}.`,
      intensity: Math.min(100, openingHype || 35),
    },
    ...(biggestUpset?.upset
      ? [
          {
            round: biggestUpset.round,
            title: 'Upset alarm',
            detail: biggestUpset.headline,
            intensity: biggestUpset.hype,
          },
        ]
      : []),
    {
      round: final?.round ?? 0,
      title: championName ? `${championName} raises the banner` : 'Final unresolved',
      detail: final?.headline ?? 'No final result was generated.',
      intensity: final?.hype ?? 0,
    },
  ];
  const momentBeats = moments
    .filter((moment) => ['rival', 'clutch', 'sponsor', 'glitch'].includes(moment.kind))
    .slice(0, 3)
    .map((moment) => ({
      round: moment.round,
      title: moment.title,
      detail: moment.detail,
      intensity: moment.intensity,
    }));
  return [...legacyBeats, ...momentBeats];
}

function createRewardOptions(
  definition: TournamentDefinition,
  strategy: TournamentStrategy,
  hypeScore: number,
  totalRewardBits: number,
): TournamentRewardOption[] {
  const tierBonus = definition.difficulty + Math.round(totalRewardBits / 120);
  const strategyBonus = strategy.id === 'prize-hunt' ? 6 : strategy.id === 'overdrive' ? 4 : 2;
  return [
    {
      id: 'crowd-cache',
      title: 'Crowd Cache',
      track: 'arena',
      amount: Math.max(8, Math.round(hypeScore / 8) + tierBonus),
      description: 'Convert broadcast heat into Arena mastery and prestige.',
      rarity: hypeScore >= 82 ? 'legend' : hypeScore >= 64 ? 'rare' : 'standard',
    },
    {
      id: 'bracket-notes',
      title: 'Bracket Notes',
      track: 'tactics',
      amount: 10 + tierBonus + strategyBonus,
      description: 'Bank matchup reads for stronger future team decisions.',
      rarity: strategy.masteryTrack === 'tactics' ? 'rare' : 'standard',
    },
    {
      id: 'strategy-relic',
      title: `${strategy.shortLabel} Relic`,
      track: strategy.masteryTrack,
      amount: 9 + tierBonus + strategyBonus,
      description: `Double down on the ${strategy.shortLabel} route from this run.`,
      rarity: strategy.id === 'overdrive' || strategy.id === 'prize-hunt' ? 'rare' : 'standard',
    },
  ];
}

function crowdMood(hypeScore: number, upsetCount: number, strategy: TournamentStrategy): string {
  if (strategy.id === 'overdrive' && hypeScore > 70) return 'glitch-drunk';
  if (hypeScore >= 85) return 'deafening';
  if (upsetCount > 1) return 'unhinged';
  if (hypeScore >= 65) return 'electric';
  if (hypeScore >= 45) return 'locked-in';
  return 'calm';
}

function playerPlacement(matches: TournamentMatch[]): string {
  const loss = matches.find(
    (match) =>
      (match.playerName === 'Your Team' || match.enemyName === 'Your Team') && match.winnerName !== 'Your Team',
  );
  if (!loss) return matches.some((match) => match.winnerName === 'Your Team') ? 'Champion' : 'Unseeded';
  return `Eliminated in Round ${loss.round}`;
}

function seedTitle(definition: TournamentDefinition, index: number): string {
  const titles = ['Rival', 'Ace', 'Wild Card', 'Cipher', 'Crest', 'Nova', 'Prime', 'Mirror'];
  if (definition.format === 'boss-rush') return index === definition.size - 2 ? 'Final Gate' : 'Gate';
  if (definition.format === 'gauntlet') return titles[index % titles.length];
  return `Seed ${index + 1}:`;
}

function seedCrest(definition: TournamentDefinition, index: number): string {
  const crests = ['Pulse', 'Volt', 'Bloom', 'Shade', 'Chrome', 'Wave', 'Flare', 'Echo'];
  return `${definition.sponsor} ${crests[index % crests.length]}`;
}
