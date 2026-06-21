# 07 — Roadmap

## Umsetzungsreihenfolge (verbindlich)

1. Projekt-Setup (Angular 22, Config, ESLint/Prettier) ✅
2. Designsystem (Tokens + Core-Komponenten)
3. API-Client, Models, Zod, Cache (Repository)
4. App-Shell / Routing (Bottom-Nav, Layout, Footer/Disclaimer)
5. Home Dashboard (F1)
6. DigiDex Liste (F2)
7. Digimon Detail (F3)
8. Evolution Lab (F4)
9. Field Explorer (F5)
10. Skill Library (F6)
11. Team Builder (F7)
12. Battle Engine (F8)
13. Arena UI (F9)
14. Random Battles (F10)
15. Tournaments (F11)
16. Compare (F12)
17. Collection (F13)
18. Mini-Games (F14)
19. Settings / Motion / Sound (F15)
20. Tests (Ausbau)
21. Performance-Pass
22. Accessibility-Pass
23. GitHub Actions Deployment (früh als CI, final als Release-Gate)
24. README / Release-Polish

## Meilensteine

- **M0 — Foundation:** Setup + Designsystem + API-Layer + Shell. *(MVP-Gerüst, deploybar)*
- **M1 — Explore:** Home + DigiDex + Detail + Evolution Lab + Fields + Skills. *(vollwertiger DigiDex)*
- **M2 — Play:** Team Builder + Battle Engine + Arena + Random Battle. *(Spielbar)*
- **M3 — Compete:** Tournaments + Compare + Collection + Mini-Games.
- **M4 — Polish:** Settings/Sound + Tests + Performance + A11y + Release.

## Definition of Done (pro Feature)

Ein Feature ist erst fertig, wenn:
- [ ] Mobile gut nutzbar (Touch ≥44px, Bottom-Nav erreichbar).
- [ ] Desktop nicht kaputt.
- [ ] Loading / Error / Empty States existieren.
- [ ] Keine TypeScript-Fehler (`strict`).
- [ ] `npm run build` erfolgreich.
- [ ] Relevante Tests vorhanden & grün (`npm run test`).
- [ ] `npm run lint` sauber.
- [ ] UI passt zum Designsystem.
- [ ] Keine unnötigen Re-Fetches (Cache genutzt).
- [ ] Commit mit exakter Message + Push auf `develop`.

## Known Risks
- DAPI-Stabilität / Rate-Limits → robustes Caching + Retry.
- Große Evolution-Listen → Virtualisierung.
- Game-Libraries (Pixi/Phaser/Three) Bundle-Größe → strikt lazy/`@defer`.
- Inkonsistente API-Felder → defensive Normalizer.
