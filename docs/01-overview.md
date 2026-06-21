# 01 — Überblick

## Vision

**DigiVerse Arena** ist eine moderne, mobile-first Website plus Browsergame auf Basis der
[DAPI](https://digi-api.com/). Sie soll sich anfühlen wie eine Mischung aus Premium-DigiDex,
Sammelkarten-Galerie, Arena-Browsergame, interaktiver Datenvisualisierung und mobilem Game-Hub.

Stilrichtung: **Digital Monster Cyber UI** — neon, holographic, glassmorphism, cyber grid,
scanlines, data particles, dark UI, high-contrast cards.

## Kernfunktionen (Scope)

- Interaktiver DigiDex mit Such-, Filter-, Vergleichssystem
- Animierte Digimon-Detailseiten
- Evolution Lab (Graph/Timeline)
- Field Explorer & Skill Library
- Team Builder mit Synergie-Scoring
- Battle Engine + Arena UI
- Random Battles, Turniere, Mini-Games
- Collection/Favorites, Battle History (lokal, IndexedDB)
- Offline-Cache, Settings (Motion/Sound/Performance)
- Auto-Deployment auf GitHub Pages bei Push auf `develop`

## Grundregeln

Arbeite **Feature für Feature**. Nach jedem abgeschlossenen Feature:

```bash
npm run lint
npm run test
npm run build
git add .
git commit -m "<exakte Commit-Message aus Feature-Doc>"
git push origin develop
```

Keine großen Monster-Commits. Jedes Feature einzeln committen.

## Tech-Stack

### Core
- Angular 22 (standalone, **zoneless**, Signals)
- TypeScript strict mode
- Angular Router mit Lazy Routes (`loadComponent` / `@defer`)
- Angular HttpClient + Interceptors
- SCSS mit Design-Tokens
- ESLint + Prettier
- **Vitest** (Unit), Playwright (E2E)

### State / Data
- Signals für UI-State
- Domain-Services: `DigimonApiService`, `DigimonRepository`, `BattleEngineService`,
  `TeamBuilderService`, `CollectionService`, `SettingsService`
- IndexedDB via **Dexie.js** (Cache, Favorites, Teams, Battle History)
- **Zod** für Runtime-Validation an der API-Grenze
- ~~TanStack Query~~ — vorerst nicht (siehe [00-improvements.md](00-improvements.md))


### Visuals & Animation (alle lazy/optional außerhalb des MVP)
- CSS-Animationen + Angular Animations für leichte Effekte/Transitions
- GSAP für komplexe UI-Animationen
- PixiJS für 2D-Partikel/Shader
- Phaser für echte Game-Modi
- Three.js nur wo 3D echten Mehrwert hat (Digivice, Arena-BG, Evolution Portal)

### UI / Design
Eigenes Designsystem (keine schwere UI-Library als Hauptdesign). Optional: Angular CDK
(Overlay/Dialog/A11y/Virtual Scroll), Lucide/Tabler Icons, Swiper, Floating UI,
D3/Cytoscape für Graphs.

## Recherche-Prioritäten
1. Offizielle DAPI-Doku
2. Angular-Doku
3. GitHub-Doku
4. Offizielle Library-Dokus
5. Seriöse Beispiele (Angular + Phaser/Pixi/Three)
