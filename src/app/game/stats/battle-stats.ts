import type { Digimon } from '../../core/models/digimon';
import { mulberry32 } from '../../core/utils/seed';

export interface BattleStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  spirit: number;
  technique: number;
}

export type AttributeName = 'Data' | 'Free' | 'Unknown' | 'Variable' | 'Vaccine' | 'Virus';

export interface DerivedSkill {
  id: string;
  sourceId: number;
  name: string;
  description: string;
  power: number;
  accuracy: number;
  cooldown: number;
  tags: string[];
  kind: 'damage' | 'support' | 'guard' | 'finisher';
}

export const STAT_KEYS: (keyof BattleStats)[] = [
  'hp',
  'attack',
  'defense',
  'speed',
  'spirit',
  'technique',
];

const LEVEL_TIERS = new Map<string, number>([
  ['baby i', 0],
  ['fresh', 0],
  ['baby', 0],
  ['baby ii', 1],
  ['in-training', 1],
  ['in training', 1],
  ['child', 2],
  ['rookie', 2],
  ['adult', 3],
  ['champion', 3],
  ['armor', 3],
  ['hybrid', 4],
  ['perfect', 4],
  ['ultimate', 5],
  ['mega', 5],
  ['ultra', 6],
  ['super ultimate', 6],
]);

const TYPE_KEYWORDS: Record<keyof BattleStats, string[]> = {
  hp: ['ancient', 'beast', 'aquatic', 'dragon', 'plant', 'rock', 'shell'],
  attack: ['beast', 'dragon', 'dark', 'demon', 'fire', 'weapon'],
  defense: ['armor', 'machine', 'rock', 'shell', 'holy', 'steel'],
  speed: ['bird', 'insect', 'wind', 'wing', 'fairy', 'light'],
  spirit: ['angel', 'demon', 'holy', 'magic', 'spirit', 'undead'],
  technique: ['machine', 'mutant', 'puppet', 'cyborg', 'wizard', 'x-antibody'],
};

export function levelTier(digimon: Pick<Digimon, 'levels'>): number {
  const levels = digimon.levels.map((level) => level.name.toLowerCase().trim());
  if (!levels.length) return 2;
  return Math.max(...levels.map((level) => LEVEL_TIERS.get(level) ?? 2));
}

export function primaryAttribute(digimon: Pick<Digimon, 'attributes'>): AttributeName {
  const raw = digimon.attributes[0]?.name?.trim() ?? 'Unknown';
  const normalized = raw.toLowerCase();
  if (normalized.includes('vaccine')) return 'Vaccine';
  if (normalized.includes('virus')) return 'Virus';
  if (normalized.includes('data')) return 'Data';
  if (normalized.includes('variable')) return 'Variable';
  if (normalized.includes('free')) return 'Free';
  return 'Unknown';
}

export function attributeMultiplier(attacker: AttributeName, defender: AttributeName): number {
  if (attacker === 'Unknown' || defender === 'Unknown') return 1;
  if (attacker === 'Free' || attacker === 'Variable' || defender === 'Free' || defender === 'Variable') {
    return 1;
  }
  if (
    (attacker === 'Vaccine' && defender === 'Virus') ||
    (attacker === 'Virus' && defender === 'Data') ||
    (attacker === 'Data' && defender === 'Vaccine')
  ) {
    return 1.25;
  }
  if (
    (defender === 'Vaccine' && attacker === 'Virus') ||
    (defender === 'Virus' && attacker === 'Data') ||
    (defender === 'Data' && attacker === 'Vaccine')
  ) {
    return 0.8;
  }
  return 1;
}

export function deriveStats(digimon: Digimon): BattleStats {
  const tier = levelTier(digimon);
  const rng = mulberry32(digimon.id);
  const base = 42 + tier * 15;
  const attribute = primaryAttribute(digimon);
  const skillBonus = Math.min(16, digimon.skills.length * 2);
  const xBonus = digimon.xAntibody ? 8 : 0;
  const typeText = `${digimon.types.map((t) => t.name).join(' ')} ${digimon.fields
    .map((f) => f.name)
    .join(' ')}`.toLowerCase();

  const stat = (key: keyof BattleStats, weight: number): number => {
    const keywordBonus = TYPE_KEYWORDS[key].some((word) => typeText.includes(word)) ? 8 : 0;
    const jitter = Math.floor(rng() * 15);
    return Math.round(base * weight + skillBonus + xBonus + keywordBonus + jitter);
  };

  const hpAttribute = attribute === 'Data' || attribute === 'Free' ? 12 : 0;
  const attackAttribute = attribute === 'Virus' ? 10 : 0;
  const defenseAttribute = attribute === 'Vaccine' ? 10 : 0;
  const techniqueAttribute = attribute === 'Variable' ? 10 : 0;

  return {
    hp: stat('hp', 1.72) + hpAttribute,
    attack: stat('attack', 1.05) + attackAttribute,
    defense: stat('defense', 0.96) + defenseAttribute,
    speed: stat('speed', 0.92),
    spirit: stat('spirit', 0.9) + Math.floor(skillBonus / 2),
    technique: stat('technique', 0.88) + techniqueAttribute + Math.floor(skillBonus / 2),
  };
}

export function statTotal(stats: BattleStats): number {
  return STAT_KEYS.reduce((total, key) => total + stats[key], 0);
}

export function rarityScore(digimon: Digimon): number {
  return Math.round(
    levelTier(digimon) * 12 +
      digimon.skills.length * 2.5 +
      digimon.fields.length * 3 +
      digimon.nextEvolutions.length * 1.5 +
      digimon.priorEvolutions.length * 1.5 +
      (digimon.xAntibody ? 18 : 0),
  );
}

export function dataCompleteness(digimon: Digimon): number {
  const checks = [
    digimon.image,
    digimon.levels.length,
    digimon.types.length,
    digimon.attributes.length,
    digimon.fields.length,
    digimon.descriptions.length,
    digimon.skills.length,
    digimon.priorEvolutions.length || digimon.nextEvolutions.length,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function deriveSkills(digimon: Digimon): DerivedSkill[] {
  const sourceSkills = digimon.skills.length
    ? digimon.skills
    : [{ id: digimon.id * 1000, name: `${digimon.name} Pulse`, translation: '', description: 'A stable data pulse.' }];

  return sourceSkills.slice(0, 4).map((skill, index) => {
    const text = `${skill.name} ${skill.description}`.toLowerCase();
    const tags = skillTags(text);
    const finisher = /ultimate|final|all at once|destroy|annihilat|omega/.test(text);
    const support = /heal|recover|protect|guard|boost|barrier|shield|sleep|bind|stun/.test(text);
    const rareBonus = Math.max(0, 14 - Math.min(12, digimon.skills.length));
    const power = Math.round(32 + levelTier(digimon) * 8 + tags.length * 4 + rareBonus + (finisher ? 22 : 0));
    const accuracy = Math.max(68, Math.min(96, 90 - index * 4 + (support ? 3 : 0) - (finisher ? 10 : 0)));

    return {
      id: `${digimon.id}:${skill.id}`,
      sourceId: skill.id,
      name: skill.name || `${digimon.name} Pulse`,
      description: skill.description || 'A focused data strike.',
      power,
      accuracy,
      cooldown: finisher ? 3 : support ? 2 : index === 0 ? 0 : 1,
      tags,
      kind: finisher ? 'finisher' : support ? 'support' : 'damage',
    };
  });
}

export function fieldAffinityBonus(attacker: Digimon, arenaField: string | null): number {
  if (!arenaField) return 1;
  return attacker.fields.some((field) => field.name.toLowerCase() === arenaField.toLowerCase()) ? 1.1 : 1;
}

function skillTags(text: string): string[] {
  const tags = new Set<string>();
  const pairs: [string, RegExp][] = [
    ['Fire', /fire|flame|burn|heat|magma/],
    ['Water', /water|aqua|ice|bubble|marine/],
    ['Light', /holy|light|heaven|angel|shine/],
    ['Dark', /dark|nightmare|demon|shadow|death/],
    ['Machine', /machine|laser|missile|metal|cannon|cyber/],
    ['Nature', /leaf|wood|plant|earth|wild|beast/],
    ['Physical', /claw|punch|kick|slash|fang|tail/],
    ['Support', /heal|guard|boost|shield|barrier|recover/],
  ];
  for (const [tag, pattern] of pairs) {
    if (pattern.test(text)) tags.add(tag);
  }
  if (!tags.size) tags.add('Data');
  return [...tags];
}
