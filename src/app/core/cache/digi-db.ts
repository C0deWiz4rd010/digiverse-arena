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

/**
 * IndexedDB cache for DAPI data. Keeps Digimon details and metadata lists locally so the
 * app stays fast and partially works offline. User-owned data (favorites, teams, history)
 * will live in additional tables added with their features.
 */
export class DigiDb extends Dexie {
  digimon!: Table<CachedDigimon, number>;
  meta!: Table<CachedMeta, string>;

  constructor() {
    super('digiverse-arena');
    this.version(1).stores({
      digimon: 'id, cachedAt',
      meta: 'resource, cachedAt',
    });
  }
}

export const digiDb = new DigiDb();

/** Cache freshness window: 7 days. */
export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type { CachedDigimon, CachedMeta };
