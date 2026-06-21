import type { Digimon, DigimonListItem, MetaEntry, Page } from '../models/digimon';
import type { RawDigimonDetail, RawDigimonListResponse, RawMetaListResponse } from './schemas';

/** Maps a raw DAPI detail payload to the normalized {@link Digimon} model. */
export function normalizeDigimon(raw: RawDigimonDetail): Digimon {
  const images = raw.images.map((i) => ({ href: i.href, transparent: i.transparent }));
  return {
    id: raw.id,
    name: raw.name,
    xAntibody: raw.xAntibody,
    image: images[0]?.href ?? null,
    images,
    levels: raw.levels.map((l) => ({ id: l.id, name: l.level })),
    types: raw.types.map((t) => ({ id: t.id, name: t.type })),
    attributes: raw.attributes.map((a) => ({ id: a.id, name: a.attribute })),
    fields: raw.fields.map((f) => ({ id: f.id, name: f.field, image: f.image ?? null })),
    releaseDate: raw.releaseDate ?? null,
    descriptions: raw.descriptions.map((d) => ({
      origin: d.origin,
      language: d.language,
      text: d.description,
    })),
    skills: raw.skills.map((s) => ({
      id: s.id,
      name: s.skill,
      translation: s.translation,
      description: s.description,
    })),
    priorEvolutions: raw.priorEvolutions.map((e) => ({
      id: e.id,
      name: e.digimon,
      condition: e.condition,
      image: e.image ?? null,
    })),
    nextEvolutions: raw.nextEvolutions.map((e) => ({
      id: e.id,
      name: e.digimon,
      condition: e.condition,
      image: e.image ?? null,
    })),
  };
}

/** Maps a raw list payload to a normalized {@link Page} of list items. */
export function normalizeDigimonList(raw: RawDigimonListResponse): Page<DigimonListItem> {
  return {
    items: raw.content.map((c) => ({ id: c.id, name: c.name, image: c.image ?? null })),
    page: raw.pageable.currentPage,
    pageSize: raw.pageable.elementsOnPage,
    totalElements: raw.pageable.totalElements,
    totalPages: raw.pageable.totalPages,
  };
}

/** Maps a raw metadata list payload (attributes / levels / fields / types / skills). */
export function normalizeMetaList(raw: RawMetaListResponse): MetaEntry[] {
  return raw.content.fields.map((f) => ({ id: f.id, name: f.name }));
}
