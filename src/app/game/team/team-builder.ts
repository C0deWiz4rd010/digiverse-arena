import type { Digimon } from '../../core/models/digimon';
import { deriveStats, primaryAttribute, statTotal } from '../stats/battle-stats';

export interface TeamDraft {
  id: string;
  name: string;
  members: Digimon[];
}

export interface TeamScore {
  power: number;
  synergy: number;
  coverage: number;
  fieldCohesion: number;
  skillDiversity: number;
  total: number;
  notes: string[];
}

export function createTeamId(memberIds: number[], prefix = 'team'): string {
  return `${prefix}-${memberIds.join('-') || 'empty'}`;
}

export function scoreTeam(members: Digimon[]): TeamScore {
  if (!members.length) {
    return {
      power: 0,
      synergy: 0,
      coverage: 0,
      fieldCohesion: 0,
      skillDiversity: 0,
      total: 0,
      notes: ['Add Digimon to start scoring.'],
    };
  }

  const power = Math.round(members.reduce((sum, member) => sum + statTotal(deriveStats(member)), 0) / members.length);
  const attributes = new Set(members.map(primaryAttribute));
  const fields = members.flatMap((member) => member.fields.map((field) => field.name));
  const fieldCounts = countValues(fields);
  const dominantField = Math.max(0, ...Object.values(fieldCounts));
  const skillTags = new Set(
    members.flatMap((member) =>
      member.skills.flatMap((skill) => `${skill.name} ${skill.description}`.toLowerCase().split(/\W+/)),
    ),
  );

  const coverage = Math.min(100, attributes.size * 22 + members.length * 4);
  const fieldCohesion = Math.min(100, dominantField * 22 + Object.keys(fieldCounts).length * 5);
  const skillDiversity = Math.min(100, Math.round(skillTags.size / Math.max(1, members.length) + members.length * 8));
  const synergy = Math.round((coverage + fieldCohesion + skillDiversity) / 3);
  const total = Math.round(power * 0.42 + synergy * 0.58);

  const notes = [
    `${attributes.size} attribute lanes covered.`,
    dominantField > 1 ? `${dominantField} members share a Field bonus.` : 'No strong Field cluster yet.',
    skillTags.size > 24 ? 'Skill vocabulary is broad.' : 'Add varied Skills for better coverage.',
  ];

  return { power, synergy, coverage, fieldCohesion, skillDiversity, total, notes };
}

export function recommendTeamPool(pool: Digimon[], size = 3): Digimon[] {
  const picked: Digimon[] = [];
  const sorted = [...pool].sort((a, b) => statTotal(deriveStats(b)) - statTotal(deriveStats(a)));
  for (const candidate of sorted) {
    if (picked.length >= size) break;
    const candidateAttribute = primaryAttribute(candidate);
    const alreadyHasAttribute = picked.some((member) => primaryAttribute(member) === candidateAttribute);
    if (!alreadyHasAttribute || picked.length >= Math.max(1, size - 2)) {
      picked.push(candidate);
    }
  }
  return picked.length ? picked : sorted.slice(0, size);
}

function countValues(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}
