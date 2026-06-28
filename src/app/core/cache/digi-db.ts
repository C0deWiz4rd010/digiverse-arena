import Dexie, { type Table } from 'dexie';
import type { Digimon, MetaEntry } from '../models/digimon';

interface CachedDigimon {
  id: number;
  data: Digimon;
  cachedAt: number;
}

interface CachedMeta {
  resource: string;
  data: MetaEntry[];
  cachedAt: number;
}

export interface SavedTeamRecord {
  id: string;
  name: string;
  memberIds: number[];
  score: number;
  createdAt: number;
  updatedAt: number;
}

export interface BattleHistoryRecord {
  id: string;
  mode: string;
  winner: 'player' | 'enemy' | 'draw';
  playerIds: number[];
  enemyIds: number[];
  summary: string;
  events: unknown[];
  createdAt: number;
}

export interface TournamentHistoryRecord {
  id: string;
  tournamentId: string;
  name: string;
  status: 'active' | 'complete';
  championName: string | null;
  run: unknown;
  createdAt: number;
  updatedAt: number;
}

export interface MasteryRecord {
  id: 'local';
  data: unknown;
  updatedAt: number;
}

export interface SettingsRecord {
  id: string;
  value: unknown;
}

export interface FavoriteRecord {
  id: number;
  name: string;
  image: string | null;
  createdAt: number;
}

export interface DigimonNoteRecord {
  digimonId: number;
  text: string;
  createdAt: number;
  updatedAt: number;
}

export interface CampaignRecord {
  id: 'local';
  data: unknown;
  updatedAt: number;
}

export interface MiniGameRunRecord {
  id: string;
  gameId: string;
  result: 'win' | 'loss';
  rewardBits: number;
  createdAt: number;
}

export interface RivalRunRecord {
  id: string;
  rivalId: number;
  rivalName: string;
  outcome: 'clear' | 'escaped' | 'standoff';
  counterAttribute: string;
  rewardBits: number;
  recap: string;
  createdAt: number;
}

export interface ExpeditionRunRecord {
  id: string;
  expeditionId: string;
  fieldName: string;
  outcome: 'complete' | 'partial' | 'lost';
  score: number;
  rewardBits: number;
  discoveries: string[];
  recap: string;
  createdAt: number;
}

export interface SkillForgeRunRecord {
  id: string;
  programId: string;
  programTitle: string;
  outcome: 'perfect' | 'stable' | 'fizzle';
  score: number;
  rewardBits: number;
  comboChain: string[];
  recap: string;
  createdAt: number;
}

export interface SquadDrillRunRecord {
  id: string;
  missionId: string;
  missionTitle: string;
  outcome: 'clear' | 'flawless' | 'strained';
  score: number;
  rewardBits: number;
  teamScore: number;
  roleSummary: string[];
  recap: string;
  createdAt: number;
}

/**
 * IndexedDB cache for DAPI data. Keeps Digimon details and metadata lists locally so the
 * app stays fast and partially works offline. User-owned data (favorites, teams, history)
 * will live in additional tables added with their features.
 */
export class DigiDb extends Dexie {
  digimon!: Table<CachedDigimon, number>;
  meta!: Table<CachedMeta, string>;
  teams!: Table<SavedTeamRecord, string>;
  battles!: Table<BattleHistoryRecord, string>;
  tournaments!: Table<TournamentHistoryRecord, string>;
  mastery!: Table<MasteryRecord, string>;
  settings!: Table<SettingsRecord, string>;
  favorites!: Table<FavoriteRecord, number>;
  notes!: Table<DigimonNoteRecord, number>;
  campaign!: Table<CampaignRecord, string>;
  miniGameRuns!: Table<MiniGameRunRecord, string>;
  rivalRuns!: Table<RivalRunRecord, string>;
  expeditionRuns!: Table<ExpeditionRunRecord, string>;
  skillForgeRuns!: Table<SkillForgeRunRecord, string>;
  squadDrillRuns!: Table<SquadDrillRunRecord, string>;

  constructor() {
    super('digiverse-arena');
    this.version(1).stores({
      digimon: 'id, cachedAt',
      meta: 'resource, cachedAt',
    });
    this.version(2).stores({
      digimon: 'id, cachedAt',
      meta: 'resource, cachedAt',
      teams: 'id, updatedAt, score',
      battles: 'id, createdAt, mode, winner',
      tournaments: 'id, tournamentId, status, updatedAt',
      mastery: 'id, updatedAt',
      settings: 'id',
    });
    this.version(3).stores({
      digimon: 'id, cachedAt',
      meta: 'resource, cachedAt',
      teams: 'id, updatedAt, score',
      battles: 'id, createdAt, mode, winner',
      tournaments: 'id, tournamentId, status, updatedAt',
      mastery: 'id, updatedAt',
      settings: 'id',
      favorites: 'id, createdAt',
      notes: 'digimonId, updatedAt',
      campaign: 'id, updatedAt',
      miniGameRuns: 'id, gameId, result, createdAt',
    });
    this.version(4).stores({
      digimon: 'id, cachedAt',
      meta: 'resource, cachedAt',
      teams: 'id, updatedAt, score',
      battles: 'id, createdAt, mode, winner',
      tournaments: 'id, tournamentId, status, updatedAt',
      mastery: 'id, updatedAt',
      settings: 'id',
      favorites: 'id, createdAt',
      notes: 'digimonId, updatedAt',
      campaign: 'id, updatedAt',
      miniGameRuns: 'id, gameId, result, createdAt',
      rivalRuns: 'id, rivalId, outcome, createdAt',
    });
    this.version(5).stores({
      digimon: 'id, cachedAt',
      meta: 'resource, cachedAt',
      teams: 'id, updatedAt, score',
      battles: 'id, createdAt, mode, winner',
      tournaments: 'id, tournamentId, status, updatedAt',
      mastery: 'id, updatedAt',
      settings: 'id',
      favorites: 'id, createdAt',
      notes: 'digimonId, updatedAt',
      campaign: 'id, updatedAt',
      miniGameRuns: 'id, gameId, result, createdAt',
      rivalRuns: 'id, rivalId, outcome, createdAt',
      expeditionRuns: 'id, expeditionId, fieldName, outcome, createdAt',
    });
    this.version(6).stores({
      digimon: 'id, cachedAt',
      meta: 'resource, cachedAt',
      teams: 'id, updatedAt, score',
      battles: 'id, createdAt, mode, winner',
      tournaments: 'id, tournamentId, status, updatedAt',
      mastery: 'id, updatedAt',
      settings: 'id',
      favorites: 'id, createdAt',
      notes: 'digimonId, updatedAt',
      campaign: 'id, updatedAt',
      miniGameRuns: 'id, gameId, result, createdAt',
      rivalRuns: 'id, rivalId, outcome, createdAt',
      expeditionRuns: 'id, expeditionId, fieldName, outcome, createdAt',
      skillForgeRuns: 'id, programId, outcome, createdAt',
    });
    this.version(7).stores({
      digimon: 'id, cachedAt',
      meta: 'resource, cachedAt',
      teams: 'id, updatedAt, score',
      battles: 'id, createdAt, mode, winner',
      tournaments: 'id, tournamentId, status, updatedAt',
      mastery: 'id, updatedAt',
      settings: 'id',
      favorites: 'id, createdAt',
      notes: 'digimonId, updatedAt',
      campaign: 'id, updatedAt',
      miniGameRuns: 'id, gameId, result, createdAt',
      rivalRuns: 'id, rivalId, outcome, createdAt',
      expeditionRuns: 'id, expeditionId, fieldName, outcome, createdAt',
      skillForgeRuns: 'id, programId, outcome, createdAt',
      squadDrillRuns: 'id, missionId, outcome, createdAt',
    });
  }
}

export const digiDb = new DigiDb();

/** Cache freshness window: 7 days. */
export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type { CachedDigimon, CachedMeta };
