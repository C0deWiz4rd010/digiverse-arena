# Scouter Duel System Plan

Stand: 28. Juni 2026

## Vision

Die bisherige Compare-Seite wird zum **Scouter Duel**: Spieler vergleichen Digimon nicht nur passiv, sondern treffen eine echte Vorhersage. Das System trainiert die Lesefaehigkeit fuer Stats, Attribute, Fields, Skills, Rarity und Datenqualitaet und speichert diese Reads als lokalen Fortschritt.

## Spielerfantasie

Der Spieler ist ein Arena-Analyst, der vor einem Kampf den richtigen Winner-Call machen muss:

- Wer gewinnt im neutralen Arena-Read?
- Wer hat in einem Field-Hazard die sauberere Linie?
- Wer ueberlebt ein Rival-Pressure-Szenario?
- Wer ist der Underdog mit der besseren Upset-Chance?

## Core Loop

1. **Load:** Drei bis vier Digimon aus Query-Parametern, ID-Input, Zufall oder Presets laden.
2. **Scout:** Kandidatenwerte, Rollen, Attribute, Field-Hooks und Skill-Linien lesen.
3. **Scenario:** Ein Matchup-Szenario waehlen.
4. **Predict:** Einen Gewinner callen.
5. **Resolve:** Scouter berechnet Winner, Confidence, Margin, Reward und Recap.
6. **Archive:** Ergebnis wird lokal gespeichert, Campaign-Facts steigen, Mastery wird vergeben.
7. **Branch:** Spieler kann Gewinnerprofil, Squad Lab oder Arena oeffnen.

## Domain-System

Neue Datei: `src/app/game/compare/scouter-duel.ts`

### Scouter Scenario

Vier Szenarien werden deterministisch erzeugt:

- **Arena Read:** neutraler Power- und Tempo-Check.
- **Rival Pressure:** Attribute-Triangle, Guard und Spirit werden wichtiger.
- **Field Hazard:** Field-Match und Datenqualitaet steigen im Wert.
- **Underdog Upset:** Rarity, Skill-Risiko und Technik koennen den Favoriten kippen.

Jedes Szenario besitzt:

- Titel
- Zieltext
- Risiko
- Difficulty
- Reward Bits
- Fokuswerte
- Tags

### Candidate Score

Pro Digimon entstehen:

- Power
- Rarity
- Data Completeness
- Attribute
- Field
- Role
- Skill Hook
- Scenario Score
- Win Odds
- Notes

### Duel Resolution

Der Spieler waehlt einen Kandidaten. Danach berechnet das System:

- tatsaechlichen Winner
- Prediction-Hit oder Miss
- Confidence
- Margin
- Reward Bits
- Mastery Track und Amount
- Recap
- Next Hook

Outcomes:

- **perfect-read:** Spieler callt den Winner und die Confidence ist hoch.
- **hit:** Spieler callt den richtigen Winner.
- **miss:** Spieler liegt daneben, bekommt aber eine konkrete Lernnotiz.

## Persistenz

Neue Dexie-Tabelle: `scouterDuelRuns`

Record:

- `id`
- `scenarioId`
- `scenarioTitle`
- `predictedName`
- `winnerName`
- `outcome`
- `confidence`
- `rewardBits`
- `recap`
- `createdAt`

Repository:

- `listScouterDuelRuns(limit = 12)`
- `saveScouterDuelRun(result)`

Campaign:

- Neuer Objective-Kind: `scouter-duel`
- Neue Fact: `scouterDuels`
- Neuer State-Eintrag: `completedScouterDuelIds`
- Daily Quest `Scouter Duel Read` wird claimable, wenn ein Duel gespeichert wurde.

## UI

Route bleibt `/compare`, sichtbarer Name wird **Scouter Duel**.

### Header

- Titel: `Scouter Duel`
- Metriken: Kandidaten, Confidence, Hit Rate, History.
- Actions: Add ID, Add Random, Starter Set, Rival Set, Mega Set.

### Scenario Rail

- Vier Szenario-Karten mit Risiko, Difficulty, Reward und Fokus.
- Aktives Szenario beeinflusst Score und Winner.

### Duel Theater

- Kandidatenkarten mit echten DAPI-Bildern.
- Winner-Prediction per Button.
- Score-Balken, Odds, Role, Attribute, Field und Skill Hook.

### Result Panel

- Outcome, Winner, Prediction, Margin, Confidence, Reward.
- Recap und Next Hook.
- Links zu Gewinnerprofil, Squad Lab und Arena.

### History

- Letzte Scouter-Duels in Collection und auf der Compare-Seite.

## Gameplay-Qualitaet

- Keine Backend-Abhaengigkeit.
- Reine Domain-Logik, deterministisch testbar.
- DAPI-Bilder mit Fallback.
- Direct-to-play: Seite muss nach dem Laden sofort einen Prediction-Call erlauben.
- Ergebnis hilft dem Spieler, bessere Arena- und Squad-Lab-Entscheidungen zu treffen.

## Akzeptanzkriterien

- `/compare` laedt als Scouter Duel.
- Query-Param `ids` funktioniert weiterhin.
- ID-Input und Random-Add laden echte DAPI-Daten.
- Szenarioauswahl aendert Scores.
- Prediction kann ausgefuehrt und gespeichert werden.
- Collection zeigt Scouter-Duel-History.
- Campaign-Facts zaehlen Scouter-Duels.
- Unit Tests pruefen Szenario, Kandidatenwertung und Resolution.
- E2E prueft Scouter Duel, Prediction, Collection und Bilder.
- Build, Lint, Unit, E2E, Deploy und Live-Smoke sind gruen.
