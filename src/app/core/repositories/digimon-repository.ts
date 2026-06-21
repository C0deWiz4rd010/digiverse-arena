import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  DigimonApiService,
  type DigimonListParams,
  type MetaResource,
} from '../api/digimon-api.service';
import { CACHE_TTL_MS, digiDb } from '../cache/digi-db';
import type { Digimon, DigimonListItem, MetaEntry, Page } from '../models/digimon';

/**
 * Cache-first data access for Digimon. Combines an IndexedDB persistence layer with an
 * in-flight request map so concurrent callers share a single network request (deduplication).
 * Components depend on this, never on {@link DigimonApiService} directly.
 */
@Injectable({ providedIn: 'root' })
export class DigimonRepository {
  private readonly api = inject(DigimonApiService);

  private readonly inflightDetail = new Map<number, Promise<Digimon>>();
  private readonly inflightList = new Map<string, Promise<Page<DigimonListItem>>>();
  private readonly inflightMeta = new Map<string, Promise<MetaEntry[]>>();

  /** Fetch a Digimon detail. Order: fresh IndexedDB cache → network (then cache). */
  async getDigimon(id: number, options: { force?: boolean } = {}): Promise<Digimon> {
    if (!options.force) {
      const cached = await digiDb.digimon.get(id).catch(() => undefined);
      if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
        return cached.data;
      }
    }
    const existing = this.inflightDetail.get(id);
    if (existing) return existing;

    const request = firstValueFrom(this.api.getDigimon(id))
      .then(async (data) => {
        await digiDb.digimon
          .put({ id: data.id, data, cachedAt: Date.now() })
          .catch(() => undefined);
        return data;
      })
      .finally(() => this.inflightDetail.delete(id));

    this.inflightDetail.set(id, request);
    return request;
  }

  /** Fetch a paginated, filtered list. Deduplicated by query, not persisted (volatile). */
  getDigimonList(params: DigimonListParams = {}): Promise<Page<DigimonListItem>> {
    const key = JSON.stringify(params);
    const existing = this.inflightList.get(key);
    if (existing) return existing;

    const request = firstValueFrom(this.api.getDigimonList(params)).finally(() =>
      this.inflightList.delete(key),
    );
    this.inflightList.set(key, request);
    return request;
  }

  /** Fetch a metadata list (attributes / levels / fields / types / skills). Cache-first. */
  async getMeta(resource: MetaResource, options: { force?: boolean } = {}): Promise<MetaEntry[]> {
    if (!options.force) {
      const cached = await digiDb.meta.get(resource).catch(() => undefined);
      if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
        return cached.data;
      }
    }
    const existing = this.inflightMeta.get(resource);
    if (existing) return existing;

    const request = firstValueFrom(this.api.getMeta(resource))
      .then(async (data) => {
        await digiDb.meta.put({ resource, data, cachedAt: Date.now() }).catch(() => undefined);
        return data;
      })
      .finally(() => this.inflightMeta.delete(resource));

    this.inflightMeta.set(resource, request);
    return request;
  }

  /** Clears all cached DAPI data (used by Settings → Reset Cache). */
  async clearCache(): Promise<void> {
    await Promise.all([digiDb.digimon.clear(), digiDb.meta.clear()]);
  }
}
