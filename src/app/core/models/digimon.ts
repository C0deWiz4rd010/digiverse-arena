/**
 * Normalized, UI-facing Digimon domain models.
 * Raw DAPI shapes live in `core/api/schemas.ts`; mapping happens in `core/api/normalize.ts`.
 * See docs/04-api-data-model.md.
 */

export interface NamedRef {
  id: number;
  name: string;
}

export interface DigimonImage {
  href: string;
  transparent: boolean;
}

export interface DigimonField {
  id: number;
  name: string;
  image: string | null;
}

export interface DigimonDescription {
  origin: string;
  language: string;
  text: string;
}

export interface DigimonSkill {
  id: number;
  name: string;
  translation: string;
  description: string;
}

export interface DigimonEvolution {
  id: number;
  name: string;
  condition: string;
  image: string | null;
}

export interface DigimonListItem {
  id: number;
  name: string;
  image: string | null;
}

export interface Digimon {
  id: number;
  name: string;
  xAntibody: boolean;
  image: string | null;
  images: DigimonImage[];
  levels: NamedRef[];
  types: NamedRef[];
  attributes: NamedRef[];
  fields: DigimonField[];
  releaseDate: string | null;
  descriptions: DigimonDescription[];
  skills: DigimonSkill[];
  priorEvolutions: DigimonEvolution[];
  nextEvolutions: DigimonEvolution[];
}

export interface Page<T> {
  items: T[];
  /** 0-indexed, matching the DAPI `currentPage`. */
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

/** A metadata entry from /attribute, /level, /field, /type, /skill list endpoints. */
export interface MetaEntry {
  id: number;
  name: string;
}

/** Convenience: the primary English (en_us) description, falling back to the first available. */
export function primaryDescription(digimon: Digimon): string | null {
  const en = digimon.descriptions.find((d) => d.language.toLowerCase().startsWith('en'));
  return (en ?? digimon.descriptions[0])?.text ?? null;
}
