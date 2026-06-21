# DigiVerse Arena

Mobile-first **Digimon DigiDex & Browsergame** built with **Angular 22**, powered by the
[DAPI](https://digi-api.com/). A premium "Digital Monster Cyber UI" experience: interactive DigiDex,
evolution graphs, team builder, arena battles, tournaments, mini-games — all client-side.

> Status: 🚧 In active development. Built feature by feature on the `develop` branch with automatic
> deployment to GitHub Pages.

## Tech Stack

- Angular 22 · standalone components · Signals · zoneless change detection
- TypeScript (strict) · SCSS design tokens
- Vitest (unit) · ESLint + Prettier
- IndexedDB (Dexie) · Zod runtime validation *(incoming)*
- Lazy game layers: PixiJS / Phaser / Three.js *(strictly deferred)*

## Documentation

The full, reviewed project plan lives in [`docs/`](docs/README.md), split into:
overview, architecture, design system, API data model, features, game design, roadmap, deployment.

## Getting Started

```bash
npm install
npm start          # dev server at http://localhost:4200
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm start` | Dev server |
| `npm run build` | Production build → `dist/digiverse-arena/browser` |
| `npm test` | Unit tests (Vitest, watch) |
| `npm run test:ci` | Unit tests once (no watch) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |

## Deployment

Pushing to `develop` triggers a GitHub Actions workflow that builds and deploys to GitHub Pages.
See [docs/08-deployment.md](docs/08-deployment.md).

## API Attribution

Data provided by the **DAPI** — https://digi-api.com/. This is a fan-made, non-commercial project.

## Legal

This is a fan-made project using public DAPI data. Digimon and related media are trademarks of
**Bandai**. This project is not affiliated with or endorsed by Bandai.
