# Squad Lab System Plan

Stand: 28. Juni 2026

## Vision

Der bisherige Team Builder wird zum **Squad Lab**: Spieler bauen nicht nur eine Liste aus Digimon, sondern trainieren eine taktische Formation. Das System soll die DAPI-Daten spuerbar spielbar machen: Attribute, Fields, Skills, Stats, Nexus-Profile und Campaign-Fortschritt werden in Rollen, Konflikte, Missionen und Drill-Ergebnisse uebersetzt.

## Spielerfantasie

Der Spieler ist ein Arena-Coach, der aus Live-DAPI-Profilen ein Squad formt, dessen Rollen liest und durch kurze Labs vorbereitet:

- Wer ist Vanguard, Anchor, Scout, Specialist oder Support?
- Welche Attribute decken Rivalen ab?
- Welcher Field-Kern taugt fuer Expeditionen und Arena-Hazards?
- Welche Skill-Chain ist die beste Eroeffnung?
- Welcher Drill gibt heute die beste Mastery?

## Core Loop

1. **Assemble:** Team aus Default, Zufall, ID-Input oder Preset laden.
2. **Read:** Squad Score, Nexus, Rollenmatrix, Formation und Warnungen lesen.
3. **Tune:** Digimon entfernen, zufaellig ergaenzen, Balanced/Field/Elite Presets testen.
4. **Drill:** Eine Squad-Mission starten, Ergebnis und Reward bekommen.
5. **Commit:** Team speichern, Drill-Historie archivieren, Campaign-Quest und Mastery fuettern.
6. **Branch:** Direkt in Arena, Nexus, Field Ops oder Skill Forge weiterspielen.

## Domain-System

Neue Datei: `src/app/game/team/squad-lab.ts`

### Squad Member Role

Jedes Teammitglied bekommt eine deterministische Rolle:

- **Vanguard:** Attack + Technique dominieren.
- **Anchor:** HP + Defense dominieren.
- **Scout:** Speed ist die staerkste Kante.
- **Specialist:** Skill-Dichte oder X-Antibody ist hoch.
- **Support:** Spirit + Technique stabilisieren das Team.

Pro Mitglied entstehen:

- Rolle
- Hauptattribut
- Primaerfield
- Power
- Trainingsfokus
- Zwei Staerken
- Ein Risiko

### Squad Diagnostics

Das Team erhaelt feinere Werte:

- **Role Balance:** wie gut Rollen verteilt sind.
- **Counter Coverage:** Attribute-Triangle und Free/Variable Stabilitaet.
- **Field Plan:** gemeinsamer Field-Kern und Expedition-Fit.
- **Tempo Control:** Speed + Technique gegen Teamgroesse.
- **Skill Relay:** abgeleitete Skill-Tags und Combo-Breite.
- **Stress:** Warnsignal aus Nexus-Warnings und fehlender Abdeckung.

### Squad Missions

Aus dem aktuellen Team entstehen vier Missionen:

- **Rival Counter Drill:** Attribute lesen, Counter-Lane sichern.
- **Field Sync Drill:** Field-Kern fuer Expeditionen und Hazards stabilisieren.
- **Skill Relay Drill:** Skill Tags in eine Combo-Kette bringen.
- **Arena Tempo Drill:** Initiative, Guard und Finisher-Timing trainieren.

Jede Mission hat:

- Ziel
- Schwierigkeit
- empfohlenen Teamaspekt
- Risiko
- Reward Bits
- Mastery Track

### Drill Resolution

Ein Drill nutzt deterministische Seeds plus Teamdiagnose:

- **flawless:** starker Fit, Bonus Reward, klare Coach-Note.
- **clear:** guter Abschluss, normaler Reward.
- **strained:** knapper Lerneffekt, kleiner Reward, konkrete Reparaturidee.

Das Ergebnis speichert:

- Mission
- Outcome
- Score
- Reward Bits
- Team Score
- Rollen-Snapshot
- Recap
- Next Hook

## Persistenz

Neue Dexie-Tabelle: `squadDrillRuns`

Record:

- `id`
- `missionId`
- `missionTitle`
- `outcome`
- `score`
- `rewardBits`
- `teamScore`
- `roleSummary`
- `recap`
- `createdAt`

Repository:

- `listSquadDrillRuns(limit = 12)`
- `saveSquadDrillRun(result)`

Campaign:

- Neuer Objective-Kind: `squad-drill`
- Neue Fact: `squadDrills`
- Neuer State-Eintrag: `completedSquadDrillIds`
- Daily Quest `Squad Lab Drill` wird claimable, wenn ein Drill clear/flawless/strained gespeichert wurde.

## UI

Route bleibt `/team-builder`, sichtbarer Name wird **Squad Lab**.

### Header

- Titel: `Squad Lab`
- Kurztext als Spielziel, keine Anleitungstafel.
- Actions: Add random, Add ID, Balance, Field Core, Elite Circuit, Save, Arena, Nexus.

### Formation Theater

- Zeigt Teammitglieder als Squad-Cards.
- Bilder bleiben echte DAPI-Bilder mit Fallback.
- Pro Karte: Rolle, Attribute, Field, Power, Fokus, Risiko.

### Coach Board

- Score-Metriken
- Nexus-Profil
- Squad-Diagnose-Balken
- Warnungen und Ideen

### Drill Board

- Vier Mission-Cards
- Auswahlzustand
- Run Squad Drill
- Ergebnis-Panel mit Outcome, Score, Reward, Recap und Next Hook
- Historie der letzten Runs

## Gameplay-Qualitaet

- Kein Backend, keine Auth, reine lokale Persistenz.
- Keine Renderer-Abhaengigkeit in Domain-Logik.
- Deterministische, testbare Aufloesung.
- Direkte Weiterleitung in Arena/Nexus/Field/Skill-Loop.
- Der Spieler soll nach einem Drill wissen, was er als naechstes verbessern kann.

## Akzeptanzkriterien

- `/team-builder` laedt als Squad Lab auf Desktop und Mobile.
- Default-Team erzeugt Rollen, Diagnose und Missionen.
- Add-ID und Presets laden echte DAPI-Daten.
- Drill kann ausgefuehrt und gespeichert werden.
- Collection zeigt Squad-Lab-Historie.
- Campaign-Facts zaehlen Squad-Drills.
- Unit Tests pruefen Rollen, Missionen und Drill-Resolution.
- E2E-Smoke prueft Squad Lab, Drill-Ergebnis und Bilder.
- Build, Lint, Unit, E2E, GitHub-Pages-Deploy und Live-Smoke sind gruen.
