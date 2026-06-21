import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import type { Digimon, DigimonListItem, MetaEntry, Page } from '../models/digimon';
import { normalizeDigimon, normalizeDigimonList, normalizeMetaList } from './normalize';
import { digimonDetailSchema, digimonListResponseSchema, metaListResponseSchema } from './schemas';

export interface DigimonListParams {
  page?: number;
  pageSize?: number;
  name?: string;
  exact?: boolean;
  attribute?: string;
  xAntibody?: boolean;
  level?: string;
}

export type MetaResource = 'attribute' | 'level' | 'field' | 'type' | 'skill';

/**
 * Thin DAPI client: performs HTTP requests, validates the raw payload with Zod at the
 * boundary, then maps to normalized domain models. No caching here — that is the
 * Repository's job. See docs/04-api-data-model.md.
 */
@Injectable({ providedIn: 'root' })
export class DigimonApiService {
  private readonly http = inject(HttpClient);

  getDigimonList(params: DigimonListParams = {}): Observable<Page<DigimonListItem>> {
    const url = API_CONFIG.buildDigimonListUrl(params);
    return this.http
      .get<unknown>(url)
      .pipe(map((raw) => normalizeDigimonList(digimonListResponseSchema.parse(raw))));
  }

  getDigimon(idOrName: number | string): Observable<Digimon> {
    const url = `${API_CONFIG.baseUrl}/digimon/${encodeURIComponent(String(idOrName))}`;
    return this.http
      .get<unknown>(url)
      .pipe(map((raw) => normalizeDigimon(digimonDetailSchema.parse(raw))));
  }

  getMeta(resource: MetaResource): Observable<MetaEntry[]> {
    const url = `${API_CONFIG.baseUrl}/${resource}?pageSize=100`;
    return this.http
      .get<unknown>(url)
      .pipe(map((raw) => normalizeMetaList(metaListResponseSchema.parse(raw))));
  }

  /** Returns the total number of entries for a metadata resource (via `pageable.totalElements`). */
  getMetaCount(resource: MetaResource): Observable<number> {
    const url = `${API_CONFIG.baseUrl}/${resource}?pageSize=1`;
    return this.http
      .get<unknown>(url)
      .pipe(map((raw) => metaListResponseSchema.parse(raw).pageable.totalElements));
  }
}
