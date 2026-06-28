# Skill Forge System Plan

Stand: 28. Juni 2026

## Ziel

Das naechste komplette Spielsystem ist **Skill Forge / Training Dojo**. DAPI-Skill-Metadaten und Digimon-Skills werden zu Trainingsprogrammen mit Combo-Fit, Timing-Risiko, Rewards, Mastery und lokaler History.

## Player Fantasy

Der Spieler betreibt ein digitales Dojo: Er liest Skill-Signale, waehlt ein Training, schickt sein Team in Combo-Drills und entwickelt klare Battle-Rollen fuer Arena, Rival Signal und Turniere.

## Core Loop

1. **Load Signals:** DAPI-Skill-Metadaten werden als Tagespool geladen.
2. **Pick Drill:** Spieler waehlt ein Training: Burst, Guard, Tempo, Support, Finisher oder Hybrid.
3. **Assess Fit:** Team-Skills, Tags, Accuracy, Power und Cooldowns ergeben Combo-Fit.
4. **Run Forge:** Ein deterministischer Drill erzeugt Outcome, Combo Chain, Reward und Coaching Notes.
5. **Archive:** Run wird lokal gespeichert und zaehlt fuer Daily/Campaign.
6. **Apply Learnings:** Spieler nutzt Hinweise in Arena, Rivals, Tournaments und Team Builder.

## Systeme

- **Skill Program Generator:** erzeugt Trainingsprogramme aus DAPI-Skillpool.
- **Combo-Fit Scoring:** bewertet Team-Skill-Tags, Rollen, Accuracy, Power und Data Quality.
- **Forge Resolver:** berechnet Perfect/Stable/Fizzle, Reward und Coaching.
- **Skill Archive:** speichert Runs in IndexedDB.
- **Campaign Integration:** neue Skill Forge Daily Quest und Encounter-Verlinkung.

## UI

- Route `/skill-forge`
- Forge Header mit Winrate, Programmen, Combo-Fit und History
- Program Deck mit Ziel, Risiko, Tags und Reward
- Forge Theater mit Combo Matrix und Team-Roster
- Result Panel mit Combo Chain, Coaching Notes und Reward
- History in Collection

## Tests

- Unit fuer Program Generator, Combo-Fit, Resolver und Winrate
- E2E fuer `/skill-forge`, Run, Bilder und Collection
- Build, Lint, Unit, E2E und Live-Smoke nach Deploy
