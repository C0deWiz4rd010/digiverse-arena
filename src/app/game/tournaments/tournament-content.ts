import type { Digimon } from '../../core/models/digimon';
import { battleSummary, simulateBattle, type BattleResult } from '../battle-engine/battle-engine';
import { analyzeDigiLink, combatTuningFromProfile } from '../nexus/digilink-nexus';
import { deriveStats, statTotal } from '../stats/battle-stats';

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
}

export interface TournamentStoryBeat {
  round: number;
  title: string;
  detail: string;
  intensity: number;
}

export interface TournamentRun {
  id: string;
  definition: TournamentDefinition;
  status: 'active' | 'complete';
  championName: string | null;
  matches: TournamentMatch[];
  contenders: TournamentContender[];
  storyBeats: TournamentStoryBeat[];
  finalHeadline: string;
  hypeScore: number;
  upsetCount: number;
  playerPlacement: string;
  rewardSummary: string;
}

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

export function runTournament(definition: TournamentDefinition, playerTeam: Digimon[], opponents: Digimon[]): TournamentRun {
  const matches: TournamentMatch[] = [];
  const contendersSnapshot = createContenders(definition, playerTeam, opponents);
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
        seed: definition.seedIds[0] + round * 101 + i,
        playerNexus: combatTuningFromProfile(analyzeDigiLink(left.team)),
        enemyNexus: combatTuningFromProfile(analyzeDigiLink(right.team)),
      });
      const leftWins = result.winner === 'player' || (result.winner === 'draw' && left.power >= right.power);
      const winner = leftWins ? left : right;
      const loser = leftWins ? right : left;
      const margin = matchMargin(result, leftWins);
      const upset = winner.power + 35 < loser.power;
      const hype = matchHype(definition, result, round, margin, upset, contenders.length === 2);
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
        rewardBits: rewardBits(definition, round, hype, upset),
      });
    }
    contenders = winners;
    round += 1;
  }

  const championName = contenders[0]?.name ?? null;
  const storyBeats = createStoryBeats(definition, matches, championName);
  const final = matches[matches.length - 1];
  const hypeScore = Math.round(matches.reduce((sum, match) => sum + match.hype, 0) / Math.max(1, matches.length));
  const upsetCount = matches.filter((match) => match.upset).length;

  return {
    id: `${definition.id}-${Date.now()}`,
    definition,
    status: 'complete',
    championName,
    matches,
    contenders: contendersSnapshot,
    storyBeats,
    finalHeadline: final?.headline ?? 'No final was resolved.',
    hypeScore,
    upsetCount,
    playerPlacement: playerPlacement(matches),
    rewardSummary: `${definition.reward} + ${matches.reduce((sum, match) => sum + match.rewardBits, 0)} bits`,
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
): number {
  const criticals = result.events.filter((event) => event.type === 'damage' && event.critical).length;
  const kos = result.events.filter((event) => event.type === 'ko').length;
  const closeness = Math.max(0, 30 - Math.abs(margin));
  const formatBoost = definition.format === 'gauntlet' ? 7 : definition.format === 'boss-rush' ? 12 : 0;
  return Math.min(
    100,
    30 + definition.difficulty * 6 + round * 5 + criticals * 4 + kos * 5 + closeness + (upset ? 18 : 0) + (final ? 16 : 0) + formatBoost,
  );
}

function rewardBits(definition: TournamentDefinition, round: number, hype: number, upset: boolean): number {
  return Math.round(definition.difficulty * 8 + round * 5 + hype / 4 + (upset ? 12 : 0));
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

function createStoryBeats(
  definition: TournamentDefinition,
  matches: TournamentMatch[],
  championName: string | null,
): TournamentStoryBeat[] {
  const openingHype = Math.max(...matches.filter((match) => match.round === 1).map((match) => match.hype), 0);
  const biggestUpset = [...matches].sort((a, b) => Number(b.upset) - Number(a.upset) || b.hype - a.hype)[0];
  const final = matches[matches.length - 1];
  return [
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
