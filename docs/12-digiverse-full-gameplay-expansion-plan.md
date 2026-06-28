# DigiVerse Full Gameplay Expansion Plan

Stand: 28. Juni 2026

## Vision

DigiVerse Arena wird zur **DigiCore Kampagne**: Jedes Feature der DAPI-App soll eine klare Spielaktion bekommen. Scannen, Favorisieren, Teams bauen, Fields erkunden, Skills lesen, Arena kaempfen, Turniere vorhersagen und Minigames spielen zahlen alle auf lokale Quests, Rewards, Digimon-Ideen und Collection-Fortschritt ein.

## Kernsysteme

- **Campaign Layer:** Daily Quests, Rivalen, Encounter Alerts, Reward Claims und lokale Kampagnen-Daten.
- **Digimon Idea Deck:** Pro Digimon werden Role, Build-Hinweis, Team-Hook, Field-Hook, Rival-Hook und Signature Moment deterministisch erzeugt.
- **Encounter Director:** Ueberraschungen wie Glitch Signal, Rival Call, Field Storm und Skill Bounty.
- **Mini-Games:** Who's That Digimon, Evolution Guess, Attribute Clash, Field Scanner und Skill Match als kurze API-getriebene Challenges.
- **Collection Archive:** Favoriten, Notizen, Teams, Battles, Turniere, Quests, Badges und Mini-Game-History.

## Feature-Ausbau

1. **Home:** Command Bridge mit Daily Quest, Rival Alert, Next Best Action und Mini-Game-Start.
2. **DigiDex:** Scan Hunt mit Role-Hints, Quest-Tags und Favorite-Fokus.
3. **Detail:** DigiProfile Deluxe mit Idea Deck, Favorite, Note, Challenge und Build-Hooks.
4. **Evolution Lab:** Evolution Quest Board mit Zielpfad-Ideen und Echo-Hinweisen.
5. **Fields:** Field Expeditions mit Hazard, Reward und Encounter Hook.
6. **Skills:** Skill Forge mit Skill-Tags, Skill Match und Digimon-Ideen.
7. **Team Builder:** Squad Lab mit Quest-Fit, Rival-Fit, Nexus-Fit und Save/Reward Loop.
8. **Nexus:** Contract Hub mit Progress-Hinweisen und Campaign-Rewards.
9. **Arena:** Arena Circuits mit Scout Panel, Encounter Rewards und Quest-Fortschritt.
10. **Random Battle:** Chaos Generator mit Run-it-back, saveable matchups and surprise modes.
11. **Tournaments:** Season Loop mit Prediction, Reward Draft und Campaign Quest Hooks.
12. **Compare:** Scouter Duel mit Winner Prediction, Field Advantage und Build-Team-Hook.
13. **Collection:** Player Archive mit Favorites, Notes, History, Quests und Mini-Game Runs.
14. **Settings:** Reset/Export-Hooks und Performance/Motion-Toggles.

## Umsetzung

- Angular-first, DOM-UI, CSS-FX, keine Engine-Migration.
- Reine Game-Logik in `src/app/game/campaign`.
- Lokale Save-Daten ueber Dexie v3.
- Jede UI-Erweiterung bleibt route-lazy und nutzt vorhandene DAPI-Repository-Daten.
- Tests: Domain-Unit, E2E-Smoke, Browser/Playwright-Bild- und Konsolencheck.
