# 18 — Meta-Progression & Mobile-First Upgrade

Großer, mobile-first-orientierter Ausbau: eine **Meta-Progression-Schicht**, die alle bestehenden
Spielsysteme verbindet (DigiTamer-Identität → DigiRank/XP → Achievements → Bits-Ökonomie → Shop),
vollständige **Personalisierung** (Multi-Theme inkl. Light-Mode, Motion, Sound, Haptics, Performance)
und ein **Mobile-UX-Politur-Durchgang** über alle Views.

## Ausgangslage (verifiziert)

- 18 Routen, alle lazy; 13 Spielsysteme in `src/app/game/**`; solides Design-System + Tokens.
- Persistenz: Dexie `digiDb` über `GameProgressRepository`. Vorhanden: favorites, notes, teams,
  battles, tournaments, mastery (`DigiCoreProfile`: Tracks arena/tactics/scan/field/skill/evolution +
  `totalMastery`), campaign state (Daily Quests/Streak-Seed), Run-Historien für jeden Modus.
- **Lücken:** `rewardBits` werden pro Ergebnis angezeigt, aber **nie kumuliert** (kein Wallet). Keine
  Spieler-Identität, kein XP/DigiRank, keine Achievements, kein `SettingsService`, kein Theming, kein
  Sound/Haptik. Settings-Seite kann nur Cache leeren / Fortschritt zurücksetzen. `/skills` nur teilweise
  (Liste, kein Detail). 9 Seiten in einem Monolithen `src/app/features/game/game-pages.ts` (Inline-Templates).
- Mobile-Nav: `bottom-nav.ts` (4 Tabs + „More"-Sheet, Safe-Area unten). Sidebar ab `>=1024px`.
- Mobile-Lücken: statische Typografie (keine fluide Skala), Small-Phone-Grids zu hoch,
  Landscape-Bottom-Sheet 78vh zu groß, Detail-Hero 2-Spalten stapelt schlecht `<500px`,
  keine `safe-area-inset-top` in der Topbar, keine aktive Nav-Animation/Badges.

## Architektur-Wiederverwendung

- Dexie `digiDb` (`src/app/core/cache/digi-db.ts`) — Version-Bump + additive Upgrades für neue Tabellen.
- `GameProgressRepository` — Reward-Saves anzapfen, um Wallet + XP + Achievement-Eval zu speisen.
- `DigiCoreProfile` Mastery (`game/mastery/digicore-mastery.ts`) + `campaignFacts()` — DigiRank & Achievements.
- Design-Tokens `src/styles/_tokens.scss` (CSS-Custom-Props) — Theme-Engine tauscht über `data-theme` an `<html>`.
- Mixins `src/styles/_mixins.scss` `from($bp)` — `$bp-sm` + fluide Typografie ergänzen.
- `bottom-nav.ts` / `sidebar.ts` — Avatar/Rank/Bits + Badges + neue Routen.

## Phasen (jede = eigener Commit; lint + test:ci + build dazwischen)

### Phase 0 — Kern-Services (ermöglicht alles Weitere)
- `SettingsService` (Signals) persistiert in Dexie `settings` + localStorage-Spiegel für sofortigen Boot:
  theme, motion (full/reduced/off), sound (on/off + volume), haptics (on/off), dataSaver, reduceEffects.
- Theme-Engine: Preset-Variablensätze in neuer `src/styles/_themes.scss`; `data-theme` an `documentElement`.
  Themes: Cyber Cyan (default), Virus Crimson, Data Emerald, Vaccine Azure, Nightmare Violet, Light.
- `SoundService` (WebAudio-Synth-Blips, keine Assets) + `HapticsService` (`navigator.vibrate`), via Settings gated.
- `PlayerService` + Dexie `profile`: Tamer-Name, Avatar-Seed, Partner-Digimon-ID, Titel, Banner, Bits-Wallet,
  XP, Streak, Onboarding-Flag, freigeschaltete Kosmetik.
- Ökonomie: persistentes Bits-Wallet; ab jetzt vorwärts aus allen Reward-Saves akkumulieren.
- Progression: DigiRank/XP-Kurve aus Mastery + Bits + Quests + Wins; Level-Up-Events.
- Achievements: Definitionen + Auswertung gegen `campaignFacts`/Mastery/Wallet/Streak (Dexie `achievements`).

### Phase 1 — Onboarding + DigiTamer-Identität
- Onboarding-Flow (Route `/welcome`, beim ersten Besuch geführt; überspringbar → Guest-Defaults):
  Tamer-Name, Partner-Digimon (Suche/Zufall), Theme, Motion-Präferenz.
- Topbar: Tamer-Avatar + DigiRank-Chip + Bits-Stand (Live-Signals).

### Phase 2 — Profil / DigiTamer HQ (neue Route `/profile`)
- Tamer-Karte (Name/Titel/Avatar/Partner), DigiRank + XP-Balken, Bits, Mastery-Track-Aufschlüsselung,
  Login-Streak, Achievement-Showcase, Schnellstatistiken.

### Phase 3 — Achievements (neue Route `/achievements`)
- Kategorisiertes Grid (Explorer/Battler/Strategist/Collector/Dedication), locked/unlocked + Fortschritt,
  Reward beim Freischalten (Bits/Titel), Unlock-Toast. Nav-Badge für neue Unlocks.

### Phase 4 — Ökonomie + Unlock-Shop (neue Route `/shop` = Nexus Exchange)
- Wallet gespeist von allen Systemen (Repository-Saves anzapfen). Daily-Login-Streak + Streak-Reward-Board.
- Shop: Bits ausgeben für Kosmetik — zusätzliche Themes, Avatar-Frames, Holo-FX, Titel, Banner; Unlocks persistiert.

### Phase 5 — Settings-Überarbeitung
- Sektionen: Appearance (Theme-Picker + Live-Vorschau, Light/Dark), Motion, Sound (Toggle + Volume + Test),
  Haptics (Toggle + Test), Performance (dataSaver, reduceEffects), Data (bestehend), Account
  (Tamer bearbeiten, Save-Export/Import als JSON).

### Phase 6 — Mobile-First-Politur (JEDE View)
- Fluide Typografie (`clamp`) + line-height-Tokens in `_tokens.scss`.
- `$bp-sm`-Grid-Tuning (Karten-/Bildhöhen); Detail-Hero stapelt `<500px`.
- Bottom-Sheet: `min(78vh, calc(100dvh - 44px))`; Topbar `safe-area-inset-top`; Landscape-L/R-Insets.
- Touch-Feedback: Haptik + Sound bei Primär-Taps, `:active`-States; animierter Bottom-Nav-Indikator + Claimable-Badges.
- Scroll-to-Top-FAB auf langen Seiten; Sticky-Section-Header; optional Pull-to-Refresh auf DigiDex/Daily-Boards.
- Per-View-Audit: Home, DigiDex, Detail, Evolution, Fields, Skills, SkillForge, Team, Nexus, Arena,
  RandomBattle, Rivals, Tournaments, Expeditions, Compare, MiniGames, Collection, Settings, Profile,
  Achievements, Shop.

### Phase 7 — Content/Feature-Politur
- `/skills` fertigstellen: Skill-Detail-Drawer (Beschreibung/Übersetzung/Tag-Klasse/welche Digimon), Tag-Filter, Forge-Link.
- Stretch: globale Command-Palette / Schnellsuche (Ctrl/Cmd-K + Mobile-Long-Press).

### Phase 8 — Code-Qualität
- `game-pages.ts`-Monolith in Per-Feature-Dateien aufteilen (hält Style-Budgets sauber).
- Gemeinsame Page-Shell/Hero/Metric-Grid ins Design-System extrahieren.

### Phase 9 — PWA (Stretch)
- Web-Manifest + Icons, installierbar, Offline-Shell (Angular Service Worker); an dataSaver gekoppelt.

## Verifikation

- Pro Phase: `npm run lint`, `npm run test:ci`, `npm run build`.
- Playwright-Smoke (`e2e/digiverse-smoke.spec.ts`) + neue Onboarding/Profile/Shop-Specs.
- Manuell: DevTools Device-Toolbar (iPhone SE/12, Pixel), Portrait **und** Landscape; Safe-Area-Sim.
- Prüfen: Bits-Wallet akkumuliert + persistiert über Reload; Theme/Settings persistieren;
  Onboarding-Skip blockiert Bestandsnutzer nie.
- Lighthouse Mobile (Perf/A11y/PWA) vorher/nachher.

## Entscheidungen / Annahmen

- Bits-Wallet akkumuliert **ab jetzt ab 0** (keine rückwirkende Neuberechnung). Bewusst simpel.
- Onboarding **überspringbar** → Bestandsnutzer erhalten „Guest Tamer"-Default; nie blockieren.
- Theming über CSS-Custom-Props + `data-theme` (kein Runtime-CSS-in-JS); Light-Mode inklusive.
- Additive Dexie-Upgrades (kein Datenverlust).
- Standardmäßig dependency-arm; Libs nur wo eine Phase klar profitiert (PWA nutzt `@angular/pwa`).
