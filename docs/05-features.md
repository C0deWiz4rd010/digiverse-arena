# 05 — Features

Umsetzung in dieser Reihenfolge. Jedes Feature endet mit `lint → test → build → commit → push origin develop`
und der angegebenen Commit-Message. Definition of Done siehe [07-roadmap.md](07-roadmap.md).

---

## F1 — Home Dashboard  `/`
Beeindruckender Einstieg.
- Animierter Cyber-Hero, Suchfeld „Search Digimon".
- Quick Actions: Open DigiDex · Random Digimon · Start Random Battle · Build Team · Evolution Lab.
- Daily Digimon, Random Skill.
- Lokal berechnete API-Stats: Anzahl Digimon/Attribute/Fields/Skills/Types/Levels.
- Hintergrund: animiertes Grid + Partikel + holografischer DigiCore (Partikel optional via PixiJS, lazy).
```bash
git commit -m "feat(home): add animated DigiVerse dashboard with quick actions"
```

## F2 — DigiDex Liste  `/dex`
Mobile-first, performant.
- Infinite/Virtual Scroll, Search by name, Exact-Toggle.
- Filter: Level, Attribute, X-Antibody, Field, Type. Sortierung: ID, Name, Level, Release.
- Card: Bild, Name, ID, Level-Chips, Attribute-Badge, X-Antibody-Marker, Holo-Hover.
- Skeleton / Empty / Error-Retry. Pull-to-refresh optional.
- Desktop: Grid 3–5 Spalten, Sticky-Filter-Sidebar, Compare-Auswahl.
```bash
git commit -m "feat(dex): add searchable filterable virtualized DigiDex grid"
```

## F3 — Digimon Detail  `/dex/:id`
Herzstück.
1. Hero: Artwork, Name, ID, Level, Attribute, Type, Field, X-Antibody, Holo-Rahmen.
2. Beschreibung (en_us bevorzugt), Expand/Collapse.
3. Skills als Cards mit Attack-Preview.
4. Evolutionen: Prior/Next, klickbar, Mini-Timeline.
5. Game Stats (deterministisch abgeleitet, siehe [06](06-game-design.md)).
6. Actions: Favorite · Add to Team · Compare · Start Battle · Evolution Lab.
- Scan-Animation übers Artwork, Attribut-Glow, Skill-Data-Chips.
```bash
git commit -m "feat(digimon-detail): add animated detail profile skills and evolution preview"
```

## F4 — Evolution Lab  `/evolution-lab`
Interaktiver Evolution-Graph (Cytoscape.js / D3 / eigenes SVG, lazy).
- Nodes = Digimon, Prior links / Next rechts, Zoom/Pan.
- Tap = Mini-Preview, Long-Press = Detail. Pfad-Suche A→B falls Daten reichen.
- Mobile: horizontale Evolution-Timeline. Holo-Nodes, leuchtende Edges, X-Antibody-Rahmen.
```bash
git commit -m "feat(evolution-lab): add interactive evolution graph explorer"
```

## F5 — Field Explorer  `/fields`
Fields als Biome-Welten (Field-`image` aus API nutzen).
- Liste, Field-Detail, Digimon pro Field, Field-Bonus im Battle.
- „Explore Field" mit animiertem Hintergrund. Desktop: Map-Grid, Mobile: Swipe-Cards.
```bash
git commit -m "feat(fields): add animated field explorer and biome filtering"
```

## F6 — Skill Library  `/skills`
- Search, Skill-Detail, Digimon mit diesem Skill.
- Skill-Tags ableiten (Fire/Water/Dark/Light/Machine/Physical/Magic/Support/Ultimate).
- Skill-Power aus Name/Beschreibung/Seltenheit. Kleine Animation-Preview (CSS/Canvas).
```bash
git commit -m "feat(skills): add searchable skill library with generated battle metadata"
```

## F7 — Team Builder  `/team-builder`
- Teamgröße 3 oder 6, optional Mega-Limit.
- Synergy/Coverage/Field/Attribute/Skill-Scores. Save (Dexie), Export JSON, Share via URL-encoded IDs.
- Hex-Slot-UI, Auto-Suggest („Balance my Team", „Build Virus Team", ...).
```bash
git commit -m "feat(team-builder): add local team creation synergy scoring and export"
```

## F8 — Battle Engine  (Logik, kein UI)
Siehe [06-game-design.md](06-game-design.md). Rein, deterministisch, getestet.
```bash
git commit -m "feat(battle-engine): add deterministic stat generation and turn simulation"
```

## F9 — Arena Battle UI  `/arena`, `/arena/battle`
Erst CSS/Pixi, dann optional Phaser (lazy).
- Mobile: Enemy oben, FX Mitte, Player-Actions unten, große Skill-Buttons, Log-Drawer, Speed 1x/2x/Auto.
- HP-Bars, Attribut-Glow, Crit-Shake, KO-Glitch.
```bash
git commit -m "feat(arena): add mobile battle screen with animated combat log"
```

## F10 — Random Battle  `/random-battle`
Modi: 1v1, 3v3, Rookie-only, Mega-Madness, X-Antibody-Chaos, Same-Field-Duel,
Attribute-Counter, Underdog. Balanciertes Matchmaking.
```bash
git commit -m "feat(random-battle): add generated battle modes and balanced matchmaking"
```

## F11 — Tournaments  `/tournaments`
- 4/8/16 Teilnehmer (User-/Random-/Themen-Teams), Bracket-View, Auto-Simulate, Watch, Champion-Screen.
- Cups: Rookie, Virus, Field Masters, X-Antibody Invitational, Legendary Clash, Random Chaos League.
```bash
git commit -m "feat(tournaments): add bracket tournaments with themed AI teams"
```

## F12 — Compare  `/compare`
2–4 Digimon vergleichen: Artwork, Level, Type, Attribute, Fields, Skills, Evolutions,
Battle-Stats, Synergy/Rarity/Completeness. Desktop: Tabelle + Radar-Chart. Mobile: Swipe + Diff-Highlights.
```bash
git commit -m "feat(compare): add Digimon comparison with stats charts and differences"
```

## F13 — Collection & Favorites  `/collection`
Favoriten (Digimon/Teams), Battle-/Tournament-History, Recently Viewed, Notes, Import/Export JSON (Dexie).
```bash
git commit -m "feat(collection): add local favorites teams and battle history"
```

## F14 — Mini-Games
Who's That Digimon? · Evolution Guess · Attribute Clash · Skill Match · Field Scanner.
```bash
git commit -m "feat(minigames): add API-driven quiz and evolution challenge modes"
```

## F15 — Settings / Motion / Sound  `/settings`
Reduce Motion, Enable Sounds/Particles, Performance Mode, Dark (default).
Sounds: Click/Scan/Evolution/Hit/Victory/Error — erst nach User-Interaktion, immer Mute-Option.
```bash
git commit -m "feat(settings): add motion sound and performance preferences"
```

---

## Querschnitt (laufend mitziehen)
- **Mobile UX:** Touch ≥44px, Bottom-Nav erreichbar, Filter als Bottom-Sheet, Sticky Action-Bar,
  zoombare Graphs, Lazy-Images, Skeletons statt Layout-Shift.
- **Performance:** Lazy-Routes, `@defer` für Game-Libs, Virtual Scroll, Cache, Dedup. Lighthouse Mobile > 85, A11y > 90.
- **A11y:** Semantik, Fokus-Stile, Keyboard-Nav, Reduced-Motion, Alt-Texte, Battle-Log textuell, keine Info nur über Farbe.
- **Legal:** Disclaimer + DAPI-Attribution im Footer (siehe [08](08-deployment.md)).
