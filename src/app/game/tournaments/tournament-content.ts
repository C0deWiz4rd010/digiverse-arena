import type { Digimon } from '../../core/models/digimon';
import { battleSummary, simulateBattle, type BattleResult } from '../battle-engine/battle-engine';

export interface TournamentDefinition {
  id: string;
  name: string;
  size: 4 | 8 | 16;
  teamSize: number;
  field: string | null;
  seedIds: number[];
  description: string;
  rule: string;
  reward: string;
}

export interface TournamentMatch {
  id: string;
  round: number;
  slot: number;
  playerName: string;
  enemyName: string;
  winnerName: string | null;
  result: BattleResult | null;
}

export interface TournamentRun {
  id: string;
  definition: TournamentDefinition;
  status: 'active' | 'complete';
  championName: string | null;
  matches: TournamentMatch[];
}

export const TOURNAMENTS: TournamentDefinition[] = [
  {
    id: 'rookie-cup',
    name: 'Rookie Cup',
    size: 4,
    teamSize: 1,
    field: null,
    seedIds: [1, 2, 3, 4],
    description: 'A readable tutorial bracket focused on basic command timing.',
    rule: 'Solo teams, no special field.',
    reward: 'Rookie Crest Badge',
  },
  {
    id: 'virus-cup',
    name: 'Virus Cup',
    size: 8,
    teamSize: 2,
    field: 'Nightmare Soldiers',
    seedIds: [11, 12, 13, 14, 15, 16, 17, 18],
    description: 'Aggressive matchups where attribute counters matter.',
    rule: 'Virus-heavy AI lineups and higher crit pressure.',
    reward: 'Redline Counter Chip',
  },
  {
    id: 'field-masters',
    name: 'Field Masters',
    size: 8,
    teamSize: 3,
    field: 'Nature Spirits',
    seedIds: [21, 22, 23, 24, 25, 26, 27, 28],
    description: 'Field cohesion tournament with meaningful affinity bonuses.',
    rule: 'Field bonus active in every round.',
    reward: 'Biome Master Key',
  },
  {
    id: 'x-antibody-invitational',
    name: 'X-Antibody Invitational',
    size: 4,
    teamSize: 3,
    field: 'Metal Empire',
    seedIds: [243, 244, 245, 246],
    description: 'A compact high-power bracket for late-game builds.',
    rule: 'High-tier seeds, shorter bracket, bigger rewards.',
    reward: 'X-Core Invite Seal',
  },
];

export function tournamentDefinition(id: string): TournamentDefinition {
  return TOURNAMENTS.find((tournament) => tournament.id === id) ?? TOURNAMENTS[0];
}

export function runTournament(definition: TournamentDefinition, playerTeam: Digimon[], opponents: Digimon[]): TournamentRun {
  const matches: TournamentMatch[] = [];
  let round = 1;
  let contenders = [
    { name: 'Your Team', team: playerTeam },
    ...chunk(opponents, definition.teamSize).map((team, index) => ({
      name: `Seed ${index + 1}: ${team[0]?.name ?? 'Unknown'}`,
      team,
    })),
  ].slice(0, definition.size);

  while (contenders.length > 1) {
    const winners: typeof contenders = [];
    for (let i = 0; i < contenders.length; i += 2) {
      const left = contenders[i];
      const right = contenders[i + 1] ?? contenders[i];
      const result = simulateBattle(left.team, right.team, {
        mode: definition.id,
        arenaField: definition.field,
        seed: definition.seedIds[0] + round * 101 + i,
      });
      const leftWins = result.winner === 'player';
      const winner = leftWins ? left : right;
      winners.push(winner);
      matches.push({
        id: `${definition.id}-r${round}-m${i / 2}`,
        round,
        slot: i / 2,
        playerName: left.name,
        enemyName: right.name,
        winnerName: winner.name,
        result,
      });
    }
    contenders = winners;
    round += 1;
  }

  return {
    id: `${definition.id}-${Date.now()}`,
    definition,
    status: 'complete',
    championName: contenders[0]?.name ?? null,
    matches,
  };
}

export function tournamentSummary(run: TournamentRun): string {
  const final = run.matches[run.matches.length - 1];
  return final?.result ? battleSummary(final.result) : 'Tournament has no resolved final yet.';
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}
