# Tournament Mode Overhaul Plan

Stand: 28. Juni 2026

## Ziel

Der Turniermodus soll sich wie ein eigenes Spielsystem anfuehlen: Vorbereitung, Strategie, Reveal-Spannung, Match-Spotlight, Story-Ueberraschungen und Reward-Draft. Der Spieler soll nicht nur ein Bracket starten, sondern eine kleine Broadcast-Session spielen.

## Neuer Loop

1. **Event waehlen:** Cup-Karte anklicken, Regeln und Risiko lesen.
2. **Strategy Card waehlen:** Balanced, Crowd, Scout, Prize oder Overdrive. Die Wahl veraendert echte Battle-Tuning-Werte, Hype und Rewards.
3. **Circuit starten:** DAPI-Teams laden, Bracket simulieren, aber nur Round 1 sofort enthuellen.
4. **Reveal spielen:** Mit jedem Reveal erscheinen neue Matches, Story-Momente, Upsets und ein Spotlight.
5. **Spotlight klicken:** Jedes Match zeigt Hype, Power-Split, Winner, Tags und Event-Log-Auszug.
6. **Prediction setzen:** Champion bleibt bis zum letzten Reveal verdeckt; ein Pick kann vorher gesetzt werden.
7. **Finale erleben:** Final Theater, Champion, Crowd Mood, Rivalenstory und Reward Bits.
8. **Prediction Bonus:** Richtige Calls zahlen Tactics Mastery, falsche Calls geben Scan-Analyse.
9. **Reward Draft:** Ein Reward wird gewaehlt und zahlt Mastery aus.
10. **Rematch:** Direkt neue Strategie oder neues Event ausprobieren.

## Design

- **Fantasy:** Cyber-coliseum broadcast with neon circuits, announcer drama and tactical preparation.
- **Interaktion:** Strategy Cards, event priming, prediction slip, reveal buttons, match spotlight, reward claim.
- **Animation:** Focused state-change motion: reveal sweep, winner pulse, upset flare, reward pop. Reduced-motion respektieren.
- **Mobile:** Controls stacken, Bracket bleibt scanbar, Cards behalten feste min-widths.
- **Core:** Reine Tournament-Engine bleibt deterministisch und testbar.

## Acceptance

- `/tournaments` zeigt Strategy Deck, Event Cards, Broadcast Panel, Round Reveal, Spotlight, Story Feed, Reward Draft.
- Strategy-Auswahl beeinflusst Run-Daten und Battle-Tuning.
- E2E prueft Launch, Reveal, Spotlight und Reward Claim.
- Build, Unit, Lint, E2E und Live-Smoke laufen gruen.
