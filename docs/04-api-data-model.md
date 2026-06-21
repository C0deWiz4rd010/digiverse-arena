# 04 — API & Datenmodell

Base URL: `https://digi-api.com/api/v1`

> Alle Shapes unten basieren auf **echten** API-Antworten (getestet beim Plan-Review).

## Endpunkte

```text
GET /digimon                 # paginierte Liste (Filter s.u.)
GET /digimon/{id}            # Detail
GET /digimon/{name}          # Detail per Name

GET /attribute  /attribute/{id|name}
GET /field      /field/{id|name}
GET /level      /level/{id|name}
GET /type       /type/{id|name}
GET /skill      /skill/{id|name}
```

### Digimon-List-Filter (Query-Params)
`name`, `exact`, `attribute`, `xAntibody`, `level`, `page`, `pageSize`

## Echte Response-Shapes

### Liste `GET /digimon`
```jsonc
{
  "content": [
    { "id": 1, "name": "Agumon", "href": "...", "image": "https://digi-api.com/images/digimon/w/Agumon.png" }
  ],
  "pageable": {
    "currentPage": 0,          // 0-indexiert!
    "elementsOnPage": 2,
    "totalElements": 1488,
    "totalPages": 743,
    "previousPage": "",
    "nextPage": "...buggy..."  // NICHT verwenden -> URLs selbst bauen
  }
}
```

### Detail `GET /digimon/{id}`
```jsonc
{
  "id": 1,
  "name": "Agumon",
  "xAntibody": false,
  "images": [{ "href": "...", "transparent": false }],
  "levels": [{ "id": 4, "level": "Child" }],
  "types": [{ "id": 1, "type": "Reptile" }],
  "attributes": [{ "id": 4, "attribute": "Vaccine" }],
  "fields": [{ "id": 8, "field": "Deep Savers", "image": "..." }],
  "releaseDate": "1997",
  "descriptions": [{ "origin": "reference_book", "language": "en_us", "description": "..." }],
  "skills": [{ "id": 1, "skill": "Baby Flame", "translation": "", "description": "..." }],
  "priorEvolutions": [{ "id": 1304, "digimon": "Algomon (Baby II)", "condition": "", "image": "...", "url": "..." }],
  "nextEvolutions": [{ "id": 493, "digimon": "Agnimon", "condition": "...", "image": "...", "url": "..." }]
}
```

### Metadaten-Liste `GET /attribute` (analog level/field/type/skill)
```jsonc
{
  "content": {
    "name": "Attribute",
    "description": "...",
    "fields": [{ "id": 1, "name": "Data", "href": "..." }]
  },
  "pageable": { "currentPage": 0, "elementsOnPage": 5, "totalElements": 7, "totalPages": 1 }
}
```

## Normalisierte TypeScript-Models (intern)

```ts
export interface DigimonListItem {
  id: number;
  name: string;
  image: string | null;
}

export interface NamedRef { id: number; name: string; }

export interface DigimonEvolution {
  id: number;
  name: string;       // aus "digimon"
  condition: string;
  image: string | null;
}

export interface DigimonDescription { origin: string; language: string; text: string; }
export interface DigimonSkill { id: number; name: string; translation: string; description: string; }
export interface DigimonField { id: number; name: string; image: string | null; }

export interface Digimon {
  id: number;
  name: string;
  xAntibody: boolean;
  image: string | null;          // primäres Artwork (images[0].href)
  images: { href: string; transparent: boolean }[];
  levels: NamedRef[];            // {id, name} (von {id, level})
  types: NamedRef[];             // von {id, type}
  attributes: NamedRef[];        // von {id, attribute}
  fields: DigimonField[];
  releaseDate: string | null;
  descriptions: DigimonDescription[];
  skills: DigimonSkill[];
  priorEvolutions: DigimonEvolution[];
  nextEvolutions: DigimonEvolution[];
}

export interface Page<T> {
  items: T[];
  page: number;        // 0-indexiert
  pageSize: number;
  totalElements: number;
  totalPages: number;
}
```

## Aufgaben (API-Layer)
1. JSON-Beispiele in `docs/api-samples/` ablegen.
2. Zod-Schemas pro Endpunkt (Raw-Shape), dann Normalizer → Models.
3. `DigimonApiService` mit zentralem Error-Handling + Retry-Interceptor.
4. Pagination-Helper: `page`/`pageSize` → URL (nie `nextPage` trusten).
5. `DigimonRepository`: Cache-First (Dexie) + In-Flight-Dedup + Signal-Caches.
6. Robuste Normalizer (Felder können fehlen/leer sein → Defaults, nie crashen).
7. Keine Felder erfinden — Spielwerte nur deterministisch ableiten ([06](06-game-design.md)).

## Wichtige Eigenheiten / Fallstricke
- `currentPage` **0-indexiert**; UI ggf. +1 anzeigen.
- `nextPage`-URL ist **kaputt** → selbst bauen.
- Bildfeld in Detail = `images[].href`; in Listen/Evolutions = `image`.
- Level-Namen sind **JP** (Child/Adult/Perfect/...). Mapping siehe [06](06-game-design.md).
- `descriptions` enthält mehrere Sprachen (`jap`, `en_us`, ...). UI bevorzugt `en_us`, Fallback erste.
- Manche Digimon haben sehr viele Evolutionen (Agumon: Dutzende) → virtualisieren/begrenzen.

## Commit
```bash
git commit -m "feat(api): add DAPI client schemas normalization and caching"
git push origin develop
```
