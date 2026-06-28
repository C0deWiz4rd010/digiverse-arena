# Field Expedition System Plan

Stand: 28. Juni 2026

## Ziel

Das naechste komplette System ist **Field Expedition / Zone Ops**. DAPI-Field-Metadaten werden zu spielbaren Missionen mit Risiko, Team-Fit, Discoveries, Bounty-Reward und lokaler History.

## Player Fantasy

Der Spieler schickt sein Team in lebendige DAPI-Biome: Dragon Roar, Nature Spirits, Nightmare Soldiers und andere Field-Signale werden zu Routen, Stuerungen, Artefakten und Story-Beats.

## Core Loop

1. **Scan Route:** Taegliche Field-Missionen werden aus DAPI-Fields erzeugt.
2. **Read Hazard:** Jede Route hat Risiko, Ziel, empfohlenes Attribut und Field-Fit.
3. **Assign Team:** Das aktuelle gespeicherte Team oder Default-Team wird bewertet.
4. **Run Expedition:** Ein deterministischer Run erzeugt Outcome, Score, Discoveries und Reward.
5. **Archive:** Ergebnis wird lokal gespeichert und zaehlt fuer Daily Quests.
6. **Reroute:** Spieler kann neue Tagesrouten remixen und bessere Team-Fits suchen.

## Systeme

- **Expedition Generator:** erzeugt Missionen, Hazards, Ziele, Rewards und Tags.
- **Team-Fit Scoring:** wertet Field-Match, empfohlenes Attribut, Power und Datenqualitaet.
- **Expedition Resolver:** berechnet Complete/Partial/Lost, Bits, Mastery und Discoveries.
- **Field Archive:** speichert lokale Runs in IndexedDB.
- **Campaign Integration:** neue Field-Expedition-Quest und Home/Collection-Anbindung.

## UI

- Route `/expeditions`
- Field Ops Header mit Winrate, Runs und Reward-Vorschau
- Mission Deck mit Threat, Risk, Reward und Tags
- Expedition Theater mit Team-Fit, Hazard, Discoveries und Run-CTA
- Team-Roster mit Bildern
- Result Panel und History Grid

## Tests

- Unit-Tests fuer Mission Generator, Team-Fit und Resolver
- E2E-Smoke fuer `/expeditions`, Run, Bilder und Collection-History
- Build, Lint, Unit, E2E, Live-Smoke nach Deploy
