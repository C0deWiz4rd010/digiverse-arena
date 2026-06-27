# DigiVerse Arena: High-End Game Systems Expansion Plan

Stand: 27. Juni 2026

## Vision

DigiVerse Arena soll sich nicht wie ein reiner DigiDex mit Kampfknopf anfuehlen, sondern wie ein lokales Browsergame, in dem Datenwissen, Teamchemie, Arena-Entscheidungen und Turnierdrama ineinandergreifen. Diese Ausbauwelle vertieft alle bestehenden Spielsysteme und fuegt mit **DigiLink Nexus** ein neues verbindendes System hinzu.

## Systemziele

- **DigiDex:** Scan-Daten sind nicht nur Sammlung, sondern Grundlage fuer Stats, Skilltags, Field-Affinitaet, Rarity, Teamrollen und Nexus-Vertraege.
- **Team Builder:** Teams bekommen feinere Lesbarkeit: Power, Synergy, Coverage, Field Cohesion, Skill Diversity und DigiLink-Protokolle.
- **Arena:** Jede Arena bekommt Risiko, Hazard, Tempo, Reward-Forecast und Nexus-Intel. Battles nutzen Nexus-Boni fuer Startfokus, Crit-Druck, Guard-Stabilitaet und Damage-Modifikatoren.
- **Turniere:** Cups bleiben Events mit Hype, Story Beats, Upsets, Rewards und Final Theater; zusaetzlich nutzen Matches Nexus-Tuning.
- **Collection:** Lokaler Fortschritt bleibt Geraet-basiert und speichert Teams, Battles, Turniere und Mastery.
- **QA:** DAPI-Daten, Bilder, Browser-Rendering, Arena-Interaktion und Turnierlauf muessen vor Deploy geprueft werden.

## Neues Spielsystem: DigiLink Nexus

DigiLink Nexus ist die taktische Verbindungsschicht zwischen DigiDex-Wissen und Kampfleistung.

- **Nexus-Aspekte:** Attribute Flow, Field Bond, Skill Mesh, Tempo Curve, Guardian Core.
- **Nexus-Grade:** S, A, B, C oder D aus dem Gesamtprofil.
- **Protokolle:** `Apex Sync`, `Prime Circuit`, `Stable Link`, `Patch Link`, `Static Link`.
- **Combat-Boni:** Startfokus, Crit-Bonus, Guard-Chance, Damage-Modifikator und Reward-Multiplier.
- **Contracts:** Kleine Zielkarten wie Counter Chain, Field Oath, Skill Mesh und Guardian Core mit Rewards und Risiko.
- **Arena-Intel:** Vor oder nach dem Kampf zeigt das System Threat, Edge, empfohlenes Protokoll und konkrete Hinweise.

## Implementation Slices

1. **Domain:** `src/app/game/nexus` mit reiner Analyse-Logik, Contracts, Arena Intel und Combat-Tuning.
2. **Battle:** `BattleOptions` erhaelt Nexus-Tuning; Simulation bleibt deterministisch und testbar.
3. **Team Builder:** Nexus Board direkt neben Team Score.
4. **Nexus Lab:** Neue Route `/nexus` als eigenes Spielsystem-Labor fuer Contracts und Teamprotokolle.
5. **Arena:** Mode-Karten bekommen Threat/Hazard/Cadence; nach Start erscheint Nexus Intel.
6. **Turniere:** Bracket-Simulation nutzt Nexus-Tuning pro Match.
7. **Tests:** Unit fuer Nexus-Grade, Contracts, Battle-Tuning und Turnierlauf; E2E prueft `/nexus`, Arena und Turniere.
8. **Deploy:** Lint, Unit, Build, E2E, DAPI-Smoke, Browser-Smoke, GitHub-Pages-Deploy.

## Acceptance Criteria

- Alle neuen Systeme laufen ohne Backend und ohne Auth.
- Keine Renderer-Objekte in Savegames.
- Visible images sind im Browser geladen oder nutzen Fallback.
- Desktop und Mobile haben keinen horizontalen Overflow.
- Arena und Turniere sind live auf GitHub Pages nutzbar.
