# 00 — Analyse & Verbesserungen des Originalplans

Der Originalplan ([plan-original.md](plan-original.md)) ist sehr stark: klare Vision, sinnvolle Feature-Reihenfolge,
durchdachtes Designsystem. Bei der Umsetzung wurden jedoch über echte API-Tests und das aktuelle
Angular-22-Setup mehrere Punkte gefunden, die korrigiert bzw. präzisiert werden müssen.

## Kritische Korrekturen

### 1. Branch-Name `develope` → `develop`
Der Plan verwendet durchgehend `develope` (Tippfehler). Wir nutzen den korrekten Branch `develop`.
Alle Workflows, Commit-/Push-Anweisungen wurden entsprechend angepasst.

### 2. Level-Namen sind japanisch, nicht englisch
Die DAPI liefert Level als **JP-Stufen**, nicht als Rookie/Champion/Ultimate:

| API-Level (JP) | EN-Äquivalent | Kampf-Tier |
| --- | --- | --- |
| Baby I | Fresh/Baby | 0 |
| Baby II | In-Training | 1 |
| Child | Rookie | 2 |
| Adult | Champion | 3 |
| Perfect | Ultimate | 4 |
| Ultimate | Mega | 5 |
| Ultra | Super Ultimate | 6 |
| Armor / Hybrid | Spezial | variabel |
| (kein Level) | Unknown | 2 (Fallback) |

→ Der Battle-Engine-Stat-Modifier muss auf die **JP-Namen** mappen. Siehe [06-game-design.md](06-game-design.md).

### 3. Pagination — `nextPage`-URL ist fehlerhaft
Die List-Response liefert `pageable.nextPage` mit einem Bug (`pageSize=pageSize=2&page=1`).
→ **Niemals `nextPage` direkt verwenden.** Stattdessen Pagination-URLs selbst aus `page`/`pageSize`
bauen. `currentPage` ist **0-indexiert**. `totalElements` ≈ 1488, `totalPages` abhängig von `pageSize`.

### 4. Bild-Felder heißen `href`, nicht `url`
Detail-Response: `images: [{ href, transparent }]`. Evolutionen: `image` (string).
Fields liefern `image`-URLs (nutzbar für Biome-Karten). Listen-Items: `image` (string).

### 5. Attribut-Matrix vollständiger
API-Attribute: `Data`, `Free`, `Virus`, `Vaccine`, `Unknown` (+ `Variable`/Hybrid laut Doku).
- Vaccine > Virus > Data > Vaccine (Dreieck)
- Free / Variable = neutral/adaptiv, Unknown = kein Bonus

### 6. Angular 22 Realität (vs. Plan-Annahmen)
- Neue Datei-Konvention: `app.ts`, `app.config.ts`, `app.routes.ts` (kein `app.component.ts`).
- **Vitest** ist der Standard-Test-Runner (nicht Jest/Karma). Plan nannte "Vitest oder Jest" — wir nehmen Vitest.
- **Zoneless** Change Detection ist Default — passt perfekt zur Signals-Strategie.
- `provideBrowserGlobalErrorListeners()` ist vorhanden.
- Builder ist `@angular/build:application` (esbuild/Vite-basiert). Build-Output: `dist/digiverse-arena/browser`.

### 7. TanStack Query — vorerst weglassen
Angular-Query ist noch jung; mit Signals + eigenem `DigimonRepository` + Dexie-Cache erreichen wir
dasselbe robuster. Optional später evaluieren. **Nicht** im MVP.

### 8. Three.js / Phaser / Pixi — strikt lazy & optional
Diese Libraries dürfen **nie** im Initial-Bundle landen. Erst ab Arena/Effekt-Features per
`@defer` / dynamischem Import laden. MVP (bis Home) kommt komplett ohne sie aus.

## Präzisierungen / Ergänzungen

- **SPA-Fallback für Pages:** `404.html` = Kopie von `index.html`, plus korrektes `base-href`.
- **API-Attribution & Disclaimer** von Anfang an im Footer, nicht erst am Ende.
- **Runtime-Validation (Zod)** nur an der API-Grenze; intern mit normalisierten, typsicheren Models arbeiten.
- **Request-Deduplication & Caching** zentral im Repository, nicht pro Komponente.
- **Deterministische Stats** mit `id` als Seed → reproduzierbar und testbar.
- **A11y & Reduced-Motion** als Querschnitt, nicht als Nachgedanke.

## Was unverändert gut bleibt

- Vision & Naming (DigiVerse Arena), Cyber-Designrichtung, Token-Palette.
- Feature-Set und Umsetzungsreihenfolge.
- Per-Feature-Commit-Disziplin.
- Mobile-first mit Bottom-Nav, Desktop-Erweiterung danach.
