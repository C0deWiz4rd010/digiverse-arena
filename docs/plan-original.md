# Projektplan für GitHub Copilot: DigiVerse Arena — Mobile-first Digimon DigiDex & Browsergame mit DAPI

## 1. Projektvision

Baue eine moderne, mobile-first Website plus Browsergame auf Basis von `https://digi-api.com/`.

Das Projekt soll alles aus der DAPI herausholen:

* komplexer interaktiver DigiDex
* animierte Digimon-Karten
* Such-, Filter- und Vergleichssysteme
* Evolution Tree / Evolution Graph
* Skill-, Type-, Attribute-, Level- und Field-Explorer
* Team Builder
* Arena Battles
* Random Battles
* Turniere
* Daily Challenges
* Mini-Games
* Collection/Favorites
* Offline Cache / IndexedDB
* Auto-Deployment auf GitHub Pages über GitHub Actions bei jedem Push auf `develope`

Das Ergebnis soll sich anfühlen wie eine Mischung aus:

* Premium DigiDex
* Sammelkarten-Galerie
* Arena-Browsergame
* interaktive Datenvisualisierung
* mobile Game-Hub

Projektname vorläufig: **DigiVerse Arena**
Alternative Namen: **DigiCore**, **DigiNexus**, **DigiArena Dex**, **Digital Tamer Hub**

---

## 2. Grundregeln für Copilot

Arbeite Feature für Feature.

Nach jedem abgeschlossenen Feature:

1. Tests ausführen
2. Build prüfen
3. Code formatieren
4. Commit erstellen
5. Auf Branch `develope` pushen

Branch-Strategie:

```bash
git checkout -b develope
git push -u origin develope
```

Nach jedem Feature:

```bash
npm run lint
npm run test
npm run build
git status
git add .
git commit -m "<genaue commit message aus Plan>"
git push origin develope
```

Keine großen Monster-Commits. Jedes Feature muss einzeln committet werden.

---

## 3. Online-Recherche-Aufgaben für Copilot

Copilot soll vor Implementierung online die offiziellen Dokumentationen prüfen.

Suche online nach:

```text
DAPI digi-api.com API documentation digimon
Angular v22 standalone components signals docs
Angular routing lazy loading standalone docs
Angular service worker PWA docs
Angular HTTP client interceptors docs
Angular animations docs
Angular CDK virtual scroll docs
GitHub Pages Angular base href GitHub Actions deploy
GitHub Actions deploy static site to GitHub Pages
Phaser 4 TypeScript Angular integration
Phaser game loop TypeScript scenes input mobile
PixiJS v8 TypeScript sprites containers filters
Three.js TypeScript Angular integration WebGL renderer
GSAP Angular animation best practices
Anime.js TypeScript docs
D3 force graph TypeScript docs
Cytoscape.js graph visualization TypeScript docs
TanStack Query Angular or Angular query data fetching
IndexedDB Dexie.js TypeScript docs
Zod TypeScript schema validation docs
Playwright Angular E2E docs
Vitest Angular setup or Jest Angular testing
Storybook Angular design system docs
```

Priorität:

1. offizielle DAPI-Doku
2. Angular-Doku
3. GitHub-Doku
4. offizielle Library-Dokus
5. seriöse Beispiele für Angular + Phaser/Pixi/Three

---

## 4. Empfohlener Tech-Stack

### Core

* Angular 22
* TypeScript strict mode
* Standalone Components
* Angular Signals
* Angular Router mit Lazy Routes
* Angular HttpClient
* Angular Animations
* SCSS oder CSS mit Design Tokens
* Vite/Angular Builder Standard
* ESLint + Prettier
* Playwright für E2E
* Vitest oder Jest für Unit Tests

### State/Data

* Angular Signals für UI-State
* Services pro Domain:

  * `DigimonApiService`
  * `DigimonRepository`
  * `BattleEngineService`
  * `TeamBuilderService`
  * `CollectionService`
  * `SettingsService`
* IndexedDB mit Dexie.js für Cache, Favorites, Teams, Battle History
* Zod für Runtime-Validation der API-Daten
* Optional TanStack Query Angular, falls stabil und sinnvoll

### Visuals & Animation

* CSS Animationen für leichte Effekte
* Angular Animations für Page Transitions
* GSAP für komplexe UI-Animationen
* PixiJS für 2D-Partikel, Hologramm-Effekte, Karten-Shader, Backgrounds
* Phaser für echte Game-Modi
* Three.js nur dort einsetzen, wo 3D wirklich Mehrwert hat:

  * 3D-Digivice
  * 3D-Arena-Hintergrund
  * rotierender DigiCore
  * Evolution Portal

### UI / Design

Keine fertige große UI-Library als Hauptdesign verwenden. Eigenes Designsystem bauen.

Optional nutzen:

* Angular CDK für Overlay, Dialog, A11y, Virtual Scroll
* Lucide Icons oder Tabler Icons
* Swiper für mobile Carousels
* Tippy/Floating UI für Tooltips
* D3 oder Cytoscape.js für Evolution Graphs

---

## 5. Designsystem vor dem Coding definieren

Erstelle zuerst ein vollständiges Designsystem.

### Designrichtung

Stil: **Digital Monster Cyber UI**

Keywords:

* neon
* holographic
* glassmorphism
* cyber grid
* scanlines
* data particles
* evolution energy
* dark UI
* mobile game dashboard
* high-contrast cards
* premium browsergame

### Farbpalette

CSS Tokens:

```css
:root {
  --color-bg-950: #05070d;
  --color-bg-900: #08111f;
  --color-bg-800: #0d1b2e;

  --color-surface-900: rgba(12, 22, 38, 0.88);
  --color-surface-800: rgba(19, 35, 58, 0.76);
  --color-surface-glass: rgba(255, 255, 255, 0.08);

  --color-primary-500: #00e5ff;
  --color-primary-400: #37f3ff;
  --color-secondary-500: #8b5cf6;
  --color-accent-500: #ffb703;
  --color-danger-500: #ff3b6b;
  --color-success-500: #35ff9e;

  --color-virus: #ff3b6b;
  --color-vaccine: #37f3ff;
  --color-data: #35ff9e;
  --color-free: #ffb703;
  --color-unknown: #aab4c4;

  --text-main: #f4f8ff;
  --text-muted: #9fb0c7;
  --text-soft: #6d7d96;

  --border-soft: rgba(255, 255, 255, 0.12);
  --shadow-neon-primary: 0 0 24px rgba(0, 229, 255, 0.35);
  --shadow-neon-purple: 0 0 28px rgba(139, 92, 246, 0.35);
}
```

### Typografie

Empfohlen:

* Headings: `Orbitron`, `Rajdhani` oder `Oxanium`
* Body: `Inter`, `Roboto` oder `Noto Sans`
* Mono/Data: `JetBrains Mono`

Font-Strategie:

* Google Fonts nur wenn Performance okay
* besser lokal via CSS importieren oder System-Fallbacks definieren
* `font-display: swap`

CSS:

```css
:root {
  --font-display: "Orbitron", "Rajdhani", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}
```

### Spacing

```css
:root {
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
}
```

### Radius

```css
:root {
  --radius-sm: 0.5rem;
  --radius-md: 0.9rem;
  --radius-lg: 1.25rem;
  --radius-xl: 1.75rem;
  --radius-pill: 999px;
}
```

### Breakpoints

Mobile first:

```css
--bp-sm: 480px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
--bp-2xl: 1536px;
```

### Komponenten-Basis

Erstelle zuerst diese Designsystem-Komponenten:

* `DigiButton`
* `DigiCard`
* `DigiChip`
* `DigiBadge`
* `DigiInput`
* `DigiSelect`
* `DigiModal`
* `DigiTabs`
* `DigiBottomNav`
* `DigiTopBar`
* `DigiSkeleton`
* `DigiEmptyState`
* `DigiErrorState`
* `DigiStatBar`
* `DigiTypeBadge`
* `DigiAttributeBadge`
* `DigiHoloFrame`
* `DigiLoadingPortal`

Commit:

```bash
git commit -m "feat(design-system): add cyber mobile-first design tokens and core UI components"
git push origin develope
```

---

## 6. API-Analyse und Datenmodell

Vor dem UI-Bau muss Copilot die API exakt untersuchen.

### Zu prüfende Endpunkte

Base URL:

```text
https://digi-api.com/api/v1
```

Endpunkte:

```text
GET /digimon
GET /digimon/{id}
GET /digimon/{name}

GET /attribute
GET /attribute/{id}
GET /attribute/{name}

GET /field
GET /field/{id}
GET /field/{name}

GET /level
GET /level/{id}
GET /level/{name}

GET /type
GET /type/{id}
GET /type/{name}

GET /skill
GET /skill/{id}
GET /skill/{name}
```

Digimon List Filter:

```text
name
exact
attribute
xAntibody
level
page
pageSize
```

### Aufgaben

1. API-Responses manuell testen.
2. JSON-Beispiele speichern in `docs/api-samples/`.
3. TypeScript Interfaces erstellen.
4. Zod Schemas erstellen.
5. API Client mit Error Handling bauen.
6. Pagination Helper bauen.
7. Cache Layer bauen.
8. Falls Felder inkonsistent sind, robuste Normalizer schreiben.

### Erwartete Datenbereiche

Nutze alle Felder, die die API liefert, zum Beispiel:

* id
* name
* images/artwork
* levels
* types
* attributes
* fields
* skills
* descriptions
* release date / debut
* prior evolutions
* next evolutions
* xAntibody
* URLs/References

Keine Felder hart erfinden, ohne sie aus API-Daten oder klaren Derived-Game-Rules abzuleiten.

Commit:

```bash
git commit -m "feat(api): add DAPI client schemas normalization and caching"
git push origin develope
```

---

## 7. Projektstruktur

Empfohlene Struktur:

```text
src/
  app/
    core/
      api/
      cache/
      config/
      guards/
      interceptors/
      models/
      repositories/
      services/
      utils/
    design-system/
      components/
      tokens/
      animations/
    features/
      home/
      digidex/
      digimon-detail/
      evolution-lab/
      team-builder/
      arena/
      tournaments/
      random-battle/
      collection/
      field-explorer/
      skill-library/
      compare/
      settings/
    game/
      battle-engine/
      phaser/
      pixi/
      three/
      balancing/
      simulations/
    shared/
      pipes/
      directives/
      components/
      validators/
    layout/
      shell/
      mobile-nav/
      desktop-sidebar/
      topbar/
  assets/
    icons/
    sounds/
    textures/
    backgrounds/
    placeholders/
  docs/
    api-samples/
    game-design/
    design-system/
```

---

## 8. Routing

Routes:

```text
/
  Home / Dashboard

/dex
  DigiDex List

/dex/:id
  Digimon Detail

/evolution-lab
  Evolution Graph Explorer

/team-builder
  Build Teams

/arena
  Arena Hub

/arena/battle
  Battle Simulator

/random-battle
  Random Battle Generator

/tournaments
  Tournament Mode

/fields
  Field Explorer

/skills
  Skill Library

/compare
  Compare Digimon

/collection
  Favorites / Collection

/settings
  Theme, Motion, Data Cache
```

Mobile:

* Bottom Navigation mit 5 Hauptpunkten:

  * Home
  * Dex
  * Arena
  * Team
  * More

Desktop:

* Sidebar links
* Content Grid
* rechte Info-/Activity-Spalte optional

Commit:

```bash
git commit -m "feat(routing): add mobile-first app shell and feature routes"
git push origin develope
```

---

## 9. Feature 1: Home Dashboard

Ziel:

Ein beeindruckender Einstieg.

Elemente:

* animierter Cyber-Hero
* Suchfeld „Search Digimon“
* Quick Actions:

  * Open DigiDex
  * Random Digimon
  * Start Random Battle
  * Build Team
  * Evolution Lab
* Daily Digimon
* Random Skill
* API Stats lokal berechnet:

  * Anzahl geladener Digimon
  * Anzahl Attribute
  * Anzahl Fields
  * Anzahl Skills
  * Anzahl Types
  * Anzahl Levels
* Hintergrund:

  * animiertes Grid
  * Partikel
  * holografischer DigiCore

Optional PixiJS für Partikel-Hintergrund.

Commit:

```bash
git commit -m "feat(home): add animated DigiVerse dashboard with quick actions"
git push origin develope
```

---

## 10. Feature 2: DigiDex Liste

Mobile-first Liste mit Performance.

Funktionen:

* Infinite Scroll oder Virtual Scroll
* Search by name
* Exact Search Toggle
* Filter:

  * Level
  * Attribute
  * X-Antibody
  * Field
  * Type
* Sortierung:

  * ID
  * Name
  * Level
  * Release/Debut falls vorhanden
* Card Layout:

  * Bild
  * Name
  * ID
  * Level Chips
  * Attribute Badge
  * X-Antibody Marker
  * kleine Glitch/Holo Animation beim Hover/Tap
* Skeleton Loading
* Empty State
* Error Retry
* Pull-to-refresh auf Mobile optional

Desktop:

* Grid mit 3–5 Spalten
* Sticky Filter Sidebar
* Compare-Auswahl

Commit:

```bash
git commit -m "feat(dex): add searchable filterable virtualized DigiDex grid"
git push origin develope
```

---

## 11. Feature 3: Digimon Detail Page

Die Detailseite soll das Herzstück sein.

Bereiche:

1. Hero Section

   * großes Artwork
   * Name
   * ID
   * Level
   * Attribute
   * Type
   * Field
   * X-Antibody
   * Hologramm-Rahmen

2. Beschreibung

   * API Description
   * Expand/Collapse
   * Übersetzungs-ready Struktur

3. Skills

   * Skill Cards
   * Skill Name
   * Skill Description
   * Skill Badge
   * animierte Attack Preview

4. Evolutionen

   * Prior Evolutions
   * Next Evolutions
   * klickbare Cards
   * Mini Evolution Timeline

5. Game Stats
   Da API vermutlich keine klassischen Kampfwerte liefert, leite Spielwerte deterministisch ab:

   * HP
   * Attack
   * Defense
   * Speed
   * Spirit
   * Technique

   Regeln:

   * Level beeinflusst Basiswerte
   * Attribute beeinflusst Stärken/Schwächen
   * Type gibt kleine Modifier
   * Anzahl Skills gibt Technique-Bonus
   * X-Antibody gibt Spezialbonus
   * ID dient als Seed, damit Werte stabil bleiben

6. Actions

   * Add to Favorites
   * Add to Team
   * Compare
   * Start Battle with this Digimon
   * Open Evolution Lab

Animation:

* Beim Öffnen scannt ein Lichtbalken über das Artwork.
* Attribute erzeugt andere Glow-Farbe.
* Skills erscheinen als Data-Chips.

Commit:

```bash
git commit -m "feat(digimon-detail): add animated detail profile skills and evolution preview"
git push origin develope
```

---

## 12. Feature 4: Evolution Lab

Baue einen interaktiven Evolution Graph.

Library prüfen:

* Cytoscape.js
* D3 Force Graph
* ngx-graph
* eigenes SVG Canvas

Features:

* Digimon als Nodes
* Prior Evolutions links
* Next Evolutions rechts
* Zoom/Pan
* Tap Node öffnet Mini Preview
* Long Press öffnet Detailseite
* Pfad-Suche:

  * „Wie komme ich von A zu B?“ falls Graph-Daten reichen
* Evolution Chain speichern
* Desktop: großer Graph
* Mobile: horizontal scrollbare Evolution Timeline

Visuals:

* Nodes als runde Holo-Cards
* Edges als leuchtende Data-Lines
* Evolution Portal Animation
* X-Antibody als spezieller Knotenrahmen

Commit:

```bash
git commit -m "feat(evolution-lab): add interactive evolution graph explorer"
git push origin develope
```

---

## 13. Feature 5: Field Explorer

Fields sollen nicht nur Filter sein, sondern eigene Welten.

Jedes Field bekommt eine visuelle Biome-Karte.

Beispiele:

* Nature Spirits → Wald / grüne Partikel
* Nightmare Soldiers → dunkler Nebel
* Dragon’s Roar → Feuer/Runen
* Deep Savers → Wasser
* Metal Empire → Maschinenraster
* Wind Guardians → Luftwirbel
* Virus Busters → helles Cyber-Licht

Features:

* Liste aller Fields
* Field Detail
* Digimon pro Field
* Field Bonus im Battle-System
* „Explore Field“ mit animiertem Hintergrund
* Desktop: Field Map Grid
* Mobile: Swipe Cards

Commit:

```bash
git commit -m "feat(fields): add animated field explorer and biome filtering"
git push origin develope
```

---

## 14. Feature 6: Skill Library

Skills sind perfekt für Spielmechaniken.

Features:

* Search Skills
* Skill Detail
* Digimon, die diesen Skill besitzen
* Skill Tags automatisch ableiten:

  * Fire
  * Water
  * Dark
  * Light
  * Machine
  * Physical
  * Magic
  * Support
  * Ultimate
* Skill Power automatisch berechnen:

  * aus Name
  * Beschreibung
  * Seltenheit über Anzahl Besitzer
* Skill Animation Preview:

  * kleine CSS/Pixi/Canvas Animation
  * z. B. Slash, Beam, Burst, Shield

Commit:

```bash
git commit -m "feat(skills): add searchable skill library with generated battle metadata"
git push origin develope
```

---

## 15. Feature 7: Team Builder

User kann Teams bauen.

Regeln:

* Teamgröße: 3 oder 6
* Maximal 1–2 Mega/Ultimate pro Team optional
* Synergie Score
* Coverage Score
* Field Bonus
* Attribute Balance
* Skill Diversity
* Save to IndexedDB
* Export als JSON
* Share via URL encoded team ids

UI:

* Mobile Drag & Drop optional
* Team Slots als leuchtende Hex-Cards
* Auto Suggest Button:

  * „Balance my Team“
  * „Build Virus Team“
  * „Build Rookie Team“
  * „Random Chaos Team“

Commit:

```bash
git commit -m "feat(team-builder): add local team creation synergy scoring and export"
git push origin develope
```

---

## 16. Feature 8: Battle Engine

Baue zuerst die Logik ohne UI.

### Kampfwerte ableiten

Beispiel:

```ts
type BattleStats = {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  spirit: number;
  technique: number;
};
```

Level Modifier:

```text
Baby/In-Training: niedrig
Rookie/Child: solide
Champion/Adult: mittel
Ultimate/Perfect: stark
Mega/Ultimate: sehr stark
Ultra/Super Ultimate: extrem
Armor/Hybrid/Fusion/Special: Spezialregeln
```

Attribute Matrix:

```text
Vaccine > Virus
Virus > Data
Data > Vaccine
Free = neutral/flexibel
Unknown = kein Bonus
```

Field Bonus:

* Wenn Arena Field zu Digimon Field passt: +10%
* Wenn Team mehrere gleiche Fields hat: Synergy +5%

Skill Rules:

* Jeder Skill wird zu einer Attacke.
* Skills bekommen Power, Accuracy, Cooldown.
* Seltene Skills sind stärker.
* Support-Skills können Buff/Debuff sein.

Battle Ablauf:

1. Beide Teams laden
2. Initiative nach Speed
3. Skill wählen
4. Schaden berechnen
5. Animation Event erzeugen
6. Status aktualisieren
7. Sieg/Niederlage prüfen
8. Battle Log speichern

Battle Log:

```ts
type BattleEvent =
  | { type: 'turn-start'; actorId: string }
  | { type: 'skill-used'; actorId: string; targetId: string; skillId: string }
  | { type: 'damage'; targetId: string; amount: number; critical: boolean }
  | { type: 'buff'; targetId: string; stat: string; amount: number }
  | { type: 'ko'; targetId: string }
  | { type: 'battle-end'; winner: 'player' | 'enemy' };
```

Commit:

```bash
git commit -m "feat(battle-engine): add deterministic stat generation and turn simulation"
git push origin develope
```

---

## 17. Feature 9: Arena Battle UI

Zuerst ohne Phaser, dann optional mit Phaser.

Mobile-first:

* oben Enemy
* Mitte Battle FX
* unten Player Actions
* Skill Buttons groß genug für Touch
* Battle Log als Drawer
* Speed Control:

  * 1x
  * 2x
  * Auto

Visuals:

* Digimon Sprites/Images als Battle Cards
* Attack Animation über CSS/Pixi
* HP Bars
* Attribute Glow
* Critical Hit Shake
* KO Glitch

Später Phaser:

* Scene `BattleScene`
* Preload Images
* Create Player/Enemy Sprites
* Animate Attacks
* Emit Events zurück an Angular

Commit:

```bash
git commit -m "feat(arena): add mobile battle screen with animated combat log"
git push origin develope
```

---

## 18. Feature 10: Random Battle

Modi:

* 1v1 Random
* 3v3 Random
* Rookie only
* Mega Madness
* X-Antibody Chaos
* Same Field Duel
* Attribute Counter Challenge
* Underdog Mode

Algorithmus:

* Digimon laden
* Filter anwenden
* zufällige Gegner wählen
* Team Power ungefähr balancen
* Battle starten

Commit:

```bash
git commit -m "feat(random-battle): add generated battle modes and balanced matchmaking"
git push origin develope
```

---

## 19. Feature 11: Tournaments

Turniermodus:

* 4, 8 oder 16 Teilnehmer
* Teilnehmer:

  * User Team
  * Random Teams
  * Themen-Teams
* Bracket View
* Auto Simulate
* Watch Battle
* Champion Screen

Bracket UI:

* Mobile: Step-by-step Runden
* Desktop: kompletter Tournament Tree

Turnierarten:

* Rookie Cup
* Virus Cup
* Field Masters
* X-Antibody Invitational
* Legendary Clash
* Random Chaos League

Commit:

```bash
git commit -m "feat(tournaments): add bracket tournaments with themed AI teams"
git push origin develope
```

---

## 20. Feature 12: Compare Mode

User kann 2–4 Digimon vergleichen.

Vergleich:

* Artwork
* Level
* Type
* Attribute
* Fields
* Skills
* Evolutions
* Battle Stats
* Synergy Score
* Rarity Score
* API Data Completeness

Desktop:

* Tabelle
* Radar Chart

Mobile:

* Swipe Vergleich
* Sticky Difference Highlights

Commit:

```bash
git commit -m "feat(compare): add Digimon comparison with stats charts and differences"
git push origin develope
```

---

## 21. Feature 13: Collection & Favorites

Lokale Sammlung ohne Backend.

Features:

* Favorite Digimon
* Favorite Teams
* Battle History
* Tournament History
* Recently Viewed
* Notes pro Digimon optional
* Local Storage / IndexedDB
* Import/Export JSON

Commit:

```bash
git commit -m "feat(collection): add local favorites teams and battle history"
git push origin develope
```

---

## 22. Feature 14: Mini-Games

Kreative Mini-Games, die API-Daten nutzen.

### Mini-Game 1: Who’s That Digimon?

* Silhouette anzeigen
* 4 Antwortmöglichkeiten
* Punkte/Streak
* Schwierigkeit über Level/Popularität

### Mini-Game 2: Evolution Guess

* Start-Digimon zeigen
* User muss mögliche Evolution wählen

### Mini-Game 3: Attribute Clash

* schnell entscheiden, welcher Attribute-Vorteil gewinnt

### Mini-Game 4: Skill Match

* Skill anzeigen
* Digimon erraten

### Mini-Game 5: Field Scanner

* Field zeigen
* passende Digimon auswählen

Commit:

```bash
git commit -m "feat(minigames): add API-driven quiz and evolution challenge modes"
git push origin develope
```

---

## 23. Feature 15: Motion, Sound und Effekte

Settings:

* Reduce Motion
* Enable Sounds
* Enable Particles
* Performance Mode
* Dark/Light optional, aber Dark ist Default

Sounds:

* UI Click
* Scan
* Evolution
* Battle Hit
* Victory
* Error Glitch

Wichtig:

* Sounds erst nach User-Interaktion abspielen.
* Immer mute option anbieten.

Commit:

```bash
git commit -m "feat(settings): add motion sound and performance preferences"
git push origin develope
```

---

## 24. Mobile-first UX Details

Mobile muss zuerst perfekt sein.

Regeln:

* Touch Targets mindestens 44px
* Bottom Nav immer erreichbar
* Filter als Bottom Sheet
* Detailseiten mit Sticky Action Bar
* Keine winzigen Tabellen auf Mobile
* Graphs müssen zoombar und pannable sein
* Große Bilder lazy loaden
* Skeletons statt Layout Shift
* Offline Cache anzeigen
* Back Buttons klar sichtbar
* Landscape Battle Mode optional

Desktop danach erweitern:

* Sidebar
* Multi-column Layout
* größere Graphs
* Hover Effects
* Keyboard Shortcuts

---

## 25. Performance

Pflicht:

* Lazy Loading für alle Feature Routes
* Image Lazy Loading
* API Pagination
* Virtual Scroll für DigiDex
* IndexedDB Cache
* Request Deduplication
* Bundle Analyse
* Pixi/Phaser/Three nur lazy importieren
* Keine Game-Library im initialen Bundle
* Angular Deferrable Views nutzen
* Web Workers optional für Turnier-Simulationen

Performance Budgets:

* Initial JS möglichst klein halten
* Bilder optimieren
* Lighthouse Mobile > 85 als Mindestziel
* Accessibility > 90

Commit:

```bash
git commit -m "perf(app): add lazy loading caching and rendering optimizations"
git push origin develope
```

---

## 26. Accessibility

Pflicht:

* Semantisches HTML
* Fokus-Stile
* ARIA nur wo nötig
* Keyboard Navigation
* Reduced Motion
* Kontrast prüfen
* Alt Texte für Digimon Images
* Buttons mit klaren Labels
* Battle Log auch textuell lesbar
* Keine Information nur über Farbe

Commit:

```bash
git commit -m "feat(a11y): improve keyboard navigation contrast and reduced motion support"
git push origin develope
```

---

## 27. Testing

Tests:

* API Service Tests
* Normalizer Tests
* Battle Engine Tests
* Stat Generation Tests
* Attribute Matrix Tests
* Team Synergy Tests
* Component Smoke Tests
* Playwright E2E:

  * Home lädt
  * DigiDex Suche funktioniert
  * Detailseite öffnet
  * Team speichern
  * Random Battle starten
  * Tournament generieren

Commit:

```bash
git commit -m "test(app): add core unit and e2e coverage for dex and battle flows"
git push origin develope
```

---

## 28. GitHub Actions Deployment

Erstelle:

```text
.github/workflows/deploy-pages.yml
```

Workflow soll bei Push auf `develope` laufen.

Beispiel:

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches:
      - develope

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install
        run: npm ci

      - name: Test
        run: npm run test -- --watch=false

      - name: Build
        run: npm run build -- --configuration production --base-href "/REPOSITORY_NAME/"

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist/PROJECT_NAME/browser

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build

    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Copilot muss `PROJECT_NAME` und `REPOSITORY_NAME` korrekt ersetzen.

Falls Angular Output anders ist, den tatsächlichen `dist/...` Pfad prüfen.

Commit:

```bash
git commit -m "ci(pages): deploy production build to GitHub Pages on develope push"
git push origin develope
```

---

## 29. Rechtliches / Disclaimer

Da Digimon eine Bandai-Franchise ist und DAPI nicht offiziell von Bandai ist, muss die Website einen Disclaimer enthalten.

Footer:

```text
This is a fan-made project using public DAPI data. Digimon and related media are trademarks of Bandai. This project is not affiliated with or endorsed by Bandai.
```

Zusätzlich:

* keine kommerzielle Monetarisierung ohne Rechteklärung
* keine offiziellen Logos verwenden, wenn nicht erlaubt
* API Attribution sichtbar machen
* Link zur DAPI-Doku im About-Bereich

Commit:

```bash
git commit -m "docs(legal): add fan project disclaimer and DAPI attribution"
git push origin develope
```

---

## 30. Finale Politur

Vor Release:

* README schreiben
* Screenshots hinzufügen
* Feature-Liste dokumentieren
* API Attribution
* Setup-Anleitung
* GitHub Pages Link
* Roadmap
* Known Issues
* Lighthouse prüfen
* Mobile Geräte testen
* Desktop testen
* 404 Fallback für Angular Routing prüfen
* Cache Reset Button testen

README Sections:

```text
# DigiVerse Arena

## Features
## Tech Stack
## API Attribution
## Getting Started
## Scripts
## Deployment
## Roadmap
## Legal Disclaimer
```

Commit:

```bash
git commit -m "docs(readme): add project overview setup deployment and roadmap"
git push origin develope
```

---

## 31. Optionale Premium-Ideen für spätere Versionen

### DigiCore AI-like Advisor

Kein echtes AI-Backend nötig. Lokale Rules Engine:

* „Welches Digimon passt in mein Team?“
* „Welches Team countert Virus?“
* „Welche Evolution Chain ist interessant?“
* „Welche Skills sind selten?“

### Daily System

Lokal generiert per Datum:

* Daily Digimon
* Daily Battle
* Daily Quiz
* Daily Tournament

### Achievement System

* First Favorite
* First Battle Win
* 10 Random Battles
* Rookie Master
* Virus Collector
* Evolution Explorer
* Skill Scholar
* Tournament Champion

### Rarity Score

Berechne Seltenheit aus:

* Level
* Anzahl Evolutions
* Anzahl Skills
* X-Antibody
* Field-Kombination
* Type/Attribute-Kombination

### Visual DNA

Jedes Digimon bekommt einen generierten visuellen Fingerprint:

* Farbe aus Attribute
* Pattern aus Type
* Partikel aus Field
* Glow aus Level
* Special Frame für X-Antibody

### Share Cards

Generiere schöne Share Cards als Canvas:

* Digimon Card
* Team Card
* Battle Result
* Tournament Winner

---

## 32. Reihenfolge der Umsetzung

Unbedingt in dieser Reihenfolge bauen:

1. Projekt Setup
2. Designsystem
3. API Client und Datenmodelle
4. App Shell / Routing
5. Home Dashboard
6. DigiDex Liste
7. Digimon Detail
8. Evolution Lab
9. Field Explorer
10. Skill Library
11. Team Builder
12. Battle Engine
13. Arena UI
14. Random Battles
15. Tournaments
16. Compare
17. Collection
18. Mini-Games
19. Settings / Motion / Sound
20. Tests
21. Performance
22. Accessibility
23. GitHub Actions Deployment
24. README / Release Polish

---

## 33. Definition of Done pro Feature

Ein Feature ist nur fertig, wenn:

* es mobile gut nutzbar ist
* Desktop nicht kaputt ist
* Loading/Error/Empty States existieren
* keine TypeScript-Fehler existieren
* Build erfolgreich ist
* relevante Tests vorhanden sind
* UI zum Designsystem passt
* Daten nicht unnötig neu geladen werden
* Commit mit exakter Message erstellt wurde
* Push auf `develope` erfolgt ist

---

## 34. Erste konkrete Copilot-Aufgabe

Starte mit:

```text
Create an Angular 22 project for DigiVerse Arena with strict TypeScript, standalone components, SCSS, routing, ESLint/Prettier, a mobile-first app shell, and a cyber Digimon-inspired design system. Before implementing features, add design tokens, core UI components, folder architecture, and documentation placeholders. Use branch develope. After finishing this setup, run tests/build, commit with: feat(app): initialize Angular DigiVerse Arena project structure, and push to origin develope.
```

Commit:

```bash
git commit -m "feat(app): initialize Angular DigiVerse Arena project structure"
git push origin develope
```
