# Rival Signal System Plan

Stand: 28. Juni 2026

## Ziel

Das naechste voll ausgebaute Spielsystem ist **Rival Signal**: ein taeglicher Nemesis-/Bounty-Loop, der DAPI-Profile, Team Builder, Nexus, Arena-Simulation und Collection-History verbindet.

## Player Fantasy

Der Spieler faengt ein stoerendes DAPI-Signal ab, scoutet den Rivalen, liest Attribute/Fields/Skills, baut ein Counter-Team und schlaegt den Rivalen in einem Duell. Jeder Run erzeugt ein kleines Battle-Drama, Rewards und lokale Rival-History.

## Core Loop

1. **Intercept:** Taeglicher Rival wird deterministisch aus Campaign Seed und DAPI geladen.
2. **Scout:** Attribut, Field, Skill-Tendenz und Threat werden sichtbar.
3. **Counter Call:** Spieler waehlt eine Counter-Lane und kann Team Builder/Nexus/Arena nutzen.
4. **Duel:** 3v3 oder fallback 1v1 Battle mit Rival-Mutator, Nexus-Tuning und Battle Log.
5. **Reward:** Bounty Bits, Mastery und Rival-History werden lokal gespeichert.
6. **Rematch:** Spieler kann mit hoeherem Druck neu laufen, bis ein sauberer Clear sitzt.

## Systeme

- **Rival Signal Generator:** erzeugt Threat, Tier, Intent, Weakness, Taunts und Bounty.
- **Scouting Puzzle:** fragt nach passender Counter-Lane und gibt Bonus bei richtigem Read.
- **Rival Duel:** nutzt existierende Battle Engine, aber mit Rival-spezifischem Seed, Team-Boosts und Recap.
- **Bounty Archive:** speichert Runs in IndexedDB und zeigt Winrate/History in Collection.
- **Campaign Integration:** Rival Encounter routet auf `/rivals`, neue Rival-Quest zahlt auf Daily Progress ein.

## UI

- Kompakter Header mit Rival, Threat, Bounty, Winrate.
- Rival Theater mit Bild, Taunt, Weakness und Battle CTA.
- Counter-Choice Grid mit klaren Attribut-Lanes.
- Battle Result Panel mit Log, Reward und Rematch.
- History-Leiste fuer letzte Rival Runs.

## Tests

- Domain-Unit fuer Signal, Counter und Duel.
- E2E-Smoke fuer `/rivals`, sichtbare Bilder, Counter-Wahl, Duel und Collection-History.
- Build/Lint/Unit/E2E plus Live GitHub-Pages-Smoke.
