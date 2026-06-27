import type { Digimon } from '../../core/models/digimon';
import { deriveSkills, deriveStats, primaryAttribute, statTotal } from '../stats/battle-stats';

export type NexusAspectId = 'attributeFlow' | 'fieldBond' | 'guardianCore' | 'skillMesh' | 'tempoCurve';
export type NexusGrade = 'A' | 'B' | 'C' | 'D' | 'S';

export interface NexusAspect {
  id: NexusAspectId;
  label: string;
  score: number;
  detail: string;
}

export interface DigiLinkProfile {
  score: number;
  grade: NexusGrade;
  protocol: string;
  aspects: NexusAspect[];
  perks: NexusCombatTuning;
  warnings: string[];
}

export interface NexusCombatTuning {
  protocolName: string;
  focusStart: number;
  critBonus: number;
  guardChance: number;
  damageModifier: number;
  rewardMultiplier: number;
}

export interface NexusContract {
  id: string;
  title: string;
  objective: string;
  reward: string;
  risk: 'calm' | 'sharp' | 'volatile';
  track: 'arena' | 'field' | 'skill' | 'tactics';
  progressHint: string;
}

export interface ArenaIntel {
  playerEdge: number;
  threat: 'manageable' | 'serious' | 'volatile';
  recommendedProtocol: string;
  rewardForecast: number;
  notes: string[];
}

export function analyzeDigiLink(team: Digimon[]): DigiLinkProfile {
  if (!team.length) {
    return {
      score: 0,
      grade: 'D',
      protocol: 'Static Link',
      aspects: emptyAspects(),
      perks: combatTuningFromScore(0, 'Static Link'),
      warnings: ['Add Digimon to awaken the Nexus.'],
    };
  }

  const attributes = team.map(primaryAttribute);
  const fields = team.flatMap((member) => member.fields.map((field) => field.name));
  const skillTags = team.flatMap((member) => deriveSkills(member).flatMap((skill) => skill.tags));
  const stats = team.map(deriveStats);
  const power = team.reduce((sum, member) => sum + statTotal(deriveStats(member)), 0) / team.length;
  const dominantField = maxCount(fields);
  const uniqueFields = new Set(fields).size;
  const uniqueAttributes = new Set(attributes).size;
  const uniqueSkillTags = new Set(skillTags).size;
  const avgTempo = stats.reduce((sum, stat) => sum + stat.speed + stat.technique, 0) / team.length;
  const avgGuard = stats.reduce((sum, stat) => sum + stat.hp + stat.defense + stat.spirit, 0) / team.length;

  const aspects: NexusAspect[] = [
    {
      id: 'attributeFlow',
      label: 'Attribute Flow',
      score: clamp(uniqueAttributes * 24 + triangleBonus(attributes)),
      detail: `${uniqueAttributes} attribute lanes create counter coverage.`,
    },
    {
      id: 'fieldBond',
      label: 'Field Bond',
      score: clamp(dominantField * 24 + uniqueFields * 5),
      detail: dominantField > 1 ? `${dominantField} members share a Field signal.` : 'No shared Field core yet.',
    },
    {
      id: 'skillMesh',
      label: 'Skill Mesh',
      score: clamp(uniqueSkillTags * 12 + team.length * 8),
      detail: `${uniqueSkillTags} derived skill tags feed tactical variety.`,
    },
    {
      id: 'tempoCurve',
      label: 'Tempo Curve',
      score: clamp(avgTempo / 2.4),
      detail: 'Speed and technique decide initiative pressure.',
    },
    {
      id: 'guardianCore',
      label: 'Guardian Core',
      score: clamp(avgGuard / 4.2),
      detail: 'HP, defense and spirit stabilize long fights.',
    },
  ];
  const score = Math.round(aspects.reduce((sum, aspect) => sum + aspect.score, 0) / aspects.length + Math.min(10, power / 80));
  const grade = gradeFor(score);
  const protocol = protocolFor(grade);
  const warnings = [
    ...(uniqueAttributes < Math.min(3, team.length) ? ['Attribute coverage is narrow.'] : []),
    ...(dominantField < 2 && team.length > 1 ? ['Field Bond has no anchor pair.'] : []),
    ...(uniqueSkillTags < 4 ? ['Skill Mesh needs more tag diversity.'] : []),
  ];

  return {
    score,
    grade,
    protocol,
    aspects,
    perks: combatTuningFromScore(score, protocol),
    warnings,
  };
}

export function generateNexusContracts(profile: DigiLinkProfile): NexusContract[] {
  const top = [...profile.aspects].sort((a, b) => b.score - a.score)[0];
  const weak = [...profile.aspects].sort((a, b) => a.score - b.score)[0];
  return [
    {
      id: 'counter-chain',
      title: 'Counter Chain',
      objective: 'Win an Arena battle while keeping Attribute Flow above 60.',
      reward: '+tactics mastery and bonus battle bits',
      risk: profile.aspects.find((a) => a.id === 'attributeFlow')!.score >= 60 ? 'calm' : 'sharp',
      track: 'tactics',
      progressHint: 'Build at least three different Attribute lanes.',
    },
    {
      id: 'field-oath',
      title: 'Field Oath',
      objective: 'Enter a Field Hazard with two members sharing a Field.',
      reward: '+field mastery and stronger arena forecast',
      risk: profile.aspects.find((a) => a.id === 'fieldBond')!.score >= 60 ? 'calm' : 'volatile',
      track: 'field',
      progressHint: 'Use Field Explorer and add matching Field members.',
    },
    {
      id: 'nexus-specialist',
      title: `${top.label} Specialist`,
      objective: `Lean into ${top.label} while repairing ${weak.label}.`,
      reward: '+skill mastery and a cleaner Nexus grade',
      risk: weak.score < 40 ? 'volatile' : 'sharp',
      track: 'skill',
      progressHint: weak.detail,
    },
  ];
}

export function arenaIntel(player: Digimon[], enemy: Digimon[], baseReward: number): ArenaIntel {
  const playerProfile = analyzeDigiLink(player);
  const enemyProfile = analyzeDigiLink(enemy);
  const playerPower = teamPower(player) * (playerProfile.perks.damageModifier + playerProfile.perks.critBonus);
  const enemyPower = teamPower(enemy) * (enemyProfile.perks.damageModifier + enemyProfile.perks.critBonus);
  const playerEdge = Math.round(playerPower - enemyPower);
  const threat = playerEdge > 80 ? 'manageable' : playerEdge > -80 ? 'serious' : 'volatile';
  return {
    playerEdge,
    threat,
    recommendedProtocol: playerProfile.protocol,
    rewardForecast: Math.round(baseReward * playerProfile.perks.rewardMultiplier),
    notes: [
      `Your Nexus grade is ${playerProfile.grade}.`,
      `Enemy Nexus grade is ${enemyProfile.grade}.`,
      playerEdge >= 0 ? 'You own the pre-fight tempo.' : 'Enemy pressure is ahead; expect sharper damage windows.',
      ...playerProfile.warnings.slice(0, 2),
    ],
  };
}

export function combatTuningFromProfile(profile: DigiLinkProfile): NexusCombatTuning {
  return profile.perks;
}

function combatTuningFromScore(score: number, protocolName: string): NexusCombatTuning {
  return {
    protocolName,
    focusStart: Math.round(score / 12),
    critBonus: Number((Math.min(0.08, score / 1400)).toFixed(3)),
    guardChance: Number((Math.min(0.12, score / 1000)).toFixed(3)),
    damageModifier: Number((1 + Math.min(0.12, score / 900)).toFixed(3)),
    rewardMultiplier: Number((1 + Math.min(0.35, score / 400)).toFixed(2)),
  };
}

function teamPower(team: Digimon[]): number {
  if (!team.length) return 0;
  return team.reduce((sum, member) => sum + statTotal(deriveStats(member)), 0) / team.length;
}

function triangleBonus(attributes: string[]): number {
  const set = new Set(attributes);
  return set.has('Data') && set.has('Virus') && set.has('Vaccine') ? 22 : 0;
}

function maxCount(values: string[]): number {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
  return Math.max(0, ...Object.values(counts));
}

function gradeFor(score: number): NexusGrade {
  if (score >= 88) return 'S';
  if (score >= 74) return 'A';
  if (score >= 58) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

function protocolFor(grade: NexusGrade): string {
  return (
    {
      S: 'Apex Sync',
      A: 'Prime Circuit',
      B: 'Stable Link',
      C: 'Patch Link',
      D: 'Static Link',
    } satisfies Record<NexusGrade, string>
  )[grade];
}

function emptyAspects(): NexusAspect[] {
  return [
    { id: 'attributeFlow', label: 'Attribute Flow', score: 0, detail: 'No attributes linked.' },
    { id: 'fieldBond', label: 'Field Bond', score: 0, detail: 'No Fields linked.' },
    { id: 'skillMesh', label: 'Skill Mesh', score: 0, detail: 'No Skills linked.' },
    { id: 'tempoCurve', label: 'Tempo Curve', score: 0, detail: 'No tempo data.' },
    { id: 'guardianCore', label: 'Guardian Core', score: 0, detail: 'No guard data.' },
  ];
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
