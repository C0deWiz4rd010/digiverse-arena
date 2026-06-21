# DigiVerse Arena — Dokumentation

Mobile-first Digimon DigiDex & Browsergame auf Basis der [DAPI](https://digi-api.com/), gebaut mit Angular 22.

Diese Doku ist der überarbeitete, aufgeteilte Projektplan. Das ursprüngliche Dokument liegt unter [plan-original.md](plan-original.md).

## Inhalt

| Dokument | Inhalt |
| --- | --- |
| [00-improvements.md](00-improvements.md) | Analyse des Originalplans + konkrete Korrekturen |
| [01-overview.md](01-overview.md) | Vision, Ziele, Grundregeln, Tech-Stack |
| [02-architecture.md](02-architecture.md) | Ordnerstruktur, Layering, State, Routing |
| [03-design-system.md](03-design-system.md) | Tokens, Typografie, Komponenten |
| [04-api-data-model.md](04-api-data-model.md) | DAPI-Endpunkte, echte Response-Shapes, Models, Zod |
| [05-features.md](05-features.md) | Alle Feature-Specs in Umsetzungsreihenfolge |
| [06-game-design.md](06-game-design.md) | Stat-Ableitung, Attribut-Matrix, Battle-Engine |
| [07-roadmap.md](07-roadmap.md) | Meilensteine, Definition of Done, Reihenfolge |
| [08-deployment.md](08-deployment.md) | GitHub Pages, Actions, SPA-Fallback |

## Quick Facts

- **Repo:** `C0deWiz4rd010/digiverse-arena` (public)
- **Branch:** `develop` (Original-Plan schrieb fälschlich `develope`)
- **Stack:** Angular 22 · standalone · Signals · zoneless · SCSS · strict TS · Vitest · ESLint/Prettier
- **API:** `https://digi-api.com/api/v1` — ~1488 Digimon, paginiert
- **Deploy:** GitHub Pages via Actions bei Push auf `develop`

## Arbeitsweise

Feature für Feature. Nach jedem Feature: `lint → test → build → commit → push origin develop`.
Keine Monster-Commits. Jedes Feature einzeln committen mit der im Feature-Doc angegebenen Commit-Message.
