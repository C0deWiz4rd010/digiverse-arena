# 06 — Game Design (Stats & Battle Engine)

Die DAPI liefert **keine** klassischen Kampfwerte. Alle Spielwerte werden **deterministisch** aus den
API-Daten abgeleitet — mit `id` als Seed, damit Werte stabil/reproduzierbar/testbar sind.

## Battle-Stats

```ts
export interface BattleStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  spirit: number;
  technique: number;
}
```

### Ableitungsregeln
- **Level** bestimmt Basiswerte (Tier-Multiplikator, s.u.).
- **Attribute** beeinflusst Stärken/Schwächen.
- **Type** gibt kleine Modifier.
- **Anzahl Skills** → Technique-Bonus.
- **X-Antibody** → Spezialbonus.
- **`id`** = Seed → deterministische Streuung (kein echtes Random im Stat-Gen).

```ts
// Pseudocode
function deriveStats(d: Digimon): BattleStats {
  const seed = d.id;
  const tier = levelTier(d.levels);          // 0..6
  const base = 40 + tier * 14;
  const rng = mulberry32(seed);              // deterministischer PRNG
  // jeder Stat = base * faktor + tierBonus + seedJitter + modifiers
  ...
}
```

## Level-Mapping (JP → Tier)

> Wichtig: API nutzt **japanische** Level-Namen. Mapping muss diese matchen.

| API-Level (JP) | EN | Tier | Stärke |
| --- | --- | --- | --- |
| Baby I | Fresh | 0 | sehr niedrig |
| Baby II | In-Training | 1 | niedrig |
| Child | Rookie | 2 | solide |
| Adult | Champion | 3 | mittel |
| Perfect | Ultimate | 4 | stark |
| Ultimate | Mega | 5 | sehr stark |
| Ultra | Super Ultimate | 6 | extrem |
| Armor / Hybrid | — | 3–4 | Spezialregeln |
| (fehlt/Unknown) | — | 2 | Fallback |

Robust mappen: lowercase, trim, sowohl JP- als auch EN-Synonyme akzeptieren.

## Attribut-Matrix

```text
Vaccine > Virus
Virus   > Data
Data    > Vaccine
Free / Variable = neutral/adaptiv
Unknown         = kein Bonus
```

```ts
// +Schadensmodifikator wenn attacker > defender
const ADVANTAGE = 1.25;
const DISADVANTAGE = 0.8;
const NEUTRAL = 1.0;
```

## Field-Bonus
- Arena-Field == Digimon-Field → +10 % auf relevante Werte.
- Mehrere gleiche Fields im Team → Synergy +5 %.

## Skill-Regeln
- Jeder Skill → Attacke mit abgeleiteten Werten: `power`, `accuracy`, `cooldown`.
- Seltene Skills (wenige Besitzer) → stärker.
- Support-Skills → Buff/Debuff statt Schaden.
- Power-Heuristik aus Name/Beschreibung (Keywords: „all at once", „much more powerful", „ultimate" → höher).

## Battle-Ablauf
1. Beide Teams laden, Stats ableiten.
2. Initiative nach `speed`.
3. Skill wählen (AI: bester erwarteter Schaden / Support bei niedrigem HP).
4. Schaden berechnen (Attribut × Field × Skill × Streuung).
5. Animation-Event erzeugen.
6. Status aktualisieren.
7. Sieg/Niederlage prüfen.
8. Battle-Log speichern.

## Battle-Log-Events

```ts
export type BattleEvent =
  | { type: 'turn-start'; actorId: string }
  | { type: 'skill-used'; actorId: string; targetId: string; skillId: string }
  | { type: 'damage'; targetId: string; amount: number; critical: boolean }
  | { type: 'buff'; targetId: string; stat: keyof BattleStats; amount: number }
  | { type: 'ko'; targetId: string }
  | { type: 'battle-end'; winner: 'player' | 'enemy' };
```

## Abgeleitete Scores (für Compare/Team/Collection)
- **Rarity Score:** Level + #Evolutions + #Skills + X-Antibody + Field/Type/Attribute-Kombi.
- **Synergy Score (Team):** Field-Overlap + Attribute-Balance + Skill-Diversity + Coverage.
- **Data Completeness:** Anteil befüllter API-Felder.

## Test-Pflicht (rein & deterministisch)
- `deriveStats` stabil für gleiche `id`.
- Level-Mapping (JP + EN + Fallback).
- Attribut-Matrix vollständig.
- Team-Synergy-Berechnung.
- Battle-Simulation terminiert + deterministisch bei festem Seed.
