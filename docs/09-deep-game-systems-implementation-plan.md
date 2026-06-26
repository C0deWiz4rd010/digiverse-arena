# DigiVerse Arena: Deep Game Systems Implementation Plan

Stand: 26. Juni 2026

## Summary

DigiVerse Arena wird vom DigiDex-Grundgeruest zu einem lokalen Browsergame ausgebaut. Der Kern bleibt DAPI-getrieben: echte Digimon-Daten, Bilder, Level, Attribute, Fields, Skills und Evolutionen werden in deterministische Spielsysteme uebersetzt. Die Simulation bleibt pure TypeScript-Logik; Angular besitzt Routing, HUD, Panels, A11y und Persistenz.

Der Ausbau priorisiert eine spielbare vertikale Scheibe statt isolierter Tabs: DigiDex-Daten laden, Teams bauen, Werte ableiten, Arena kaempfen, Turniere simulieren, Fortschritt sammeln und alles im Browser verifizieren.

## Key Systems

- **DigiDex Data Spine:** Suche, Detaildaten, Bilder, Metadaten, Skill- und Field-Sichten nutzen weiterhin `DigimonRepository`, Zod-Normalisierung und Dexie-Cache.
- **Deterministic Stats:** Battle-Werte entstehen stabil aus `id`, JP-Level, Attribut, Type, Field, Skill-Anzahl, X-Antibody und Datenvollstaendigkeit.
- **Team Builder:** Teams mit 1-6 Digimon, Synergy, Coverage, Field-Kohesion, Skill-Diversity, Export/Share und lokaler Speicherung.
- **Battle Engine:** Reine rundenbasierte Simulation mit seeded RNG, Initiative, Skill-Wahl, Guard/Focus, Schaden, Crits, Buffs, KO und Battle-Log.
- **Arena:** Local-first PvE-Hub mit Solo Duel, Team Clash, Field Hazard, Boss Gate, Daily Trial und Random Battle.
- **Turniere:** 4/8/16er Brackets, themed AI-Teams, Watch/Auto-Simulate, Champion-Screen, History und idempotente Rewards.
- **DigiCore Mastery:** Neues Meta-System mit Tracks `scan`, `field`, `skill`, `tactics`, `arena` und `evolution`. Aktionen erzeugen lokale Mastery-Punkte und schalten Scouter-Hinweise, Badges und Turnier-Einladungen frei.
- **Collection:** Favoriten, Teams, Battle History, Tournament History und DigiCore-Profil liegen lokal in IndexedDB.

## Public Interfaces

- `BattleStats`, `DerivedSkill`, `BattleCombatant`, `BattleState`, `BattleCommand`, `BattleEvent`, `BattleResult`
- `TeamDraft`, `TeamScore`, `TeamRecommendation`
- `ArenaModeDefinition`, `ArenaRunSummary`
- `TournamentDefinition`, `TournamentRun`, `TournamentMatch`
- `DigiCoreProfile`, `MasteryTrack`, `MasteryEvent`, `MasteryUnlock`
- Dexie v2 Tabellen: `teams`, `battles`, `tournaments`, `mastery`, `settings`

## Implementation Defaults

- Keine Renderer-Objekte in Savegames.
- Keine `pageable.nextPage`-URLs der DAPI verwenden; Pagination wird selbst gebaut.
- Fehlende oder defekte Bilder bekommen visuelle Platzhalter und brechen keine Views.
- Arena- und Turnier-UI starten mit DOM/CSS-FX; Phaser/Pixi bleiben spaeter lazy nachruestbar.
- Alle Features muessen mobil nutzbar bleiben; Touchziele mindestens 44px.
- GitHub Pages bleibt Ziel-Deploy ueber `develop`.

## Verification

- `npm run lint`
- `npm run test:ci`
- `npm run build`
- DAPI-Smoke: Liste, Detail und Bild-HEAD pruefen.
- Browser-Smoke: Home, DigiDex, Detail, Team Builder, Arena, Random Battle, Turniere, Collection und Settings laden ohne Console Errors.
- Bild-Smoke: sichtbare Digimon-Bilder auf Home/Dex/Detail/Arena laden oder Fallback sichtbar.
- Deploy-Smoke: GitHub-Pages-URL mit Deep-Link-Reload pruefen.
