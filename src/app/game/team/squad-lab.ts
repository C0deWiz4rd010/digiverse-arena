import type { Digimon } from '../../core/models/digimon';
import { dayIndex, mulberry32 } from '../../core/utils/seed';
import type { MasteryTrack } from '../mastery/digicore-mastery';
import { analyzeDigiLink } from '../nexus/digilink-nexus';
import {
  deriveSkills,
  deriveStats,
  primaryAttribute,
  statTotal,
  type BattleStats,
} from '../stats/battle-stats';
import { scoreTeam, type TeamScore } from './team-builder';

export type SquadRole = 'Anchor' | 'Scout' | 'Specialist' | 'Support' | 'Vanguard';
export type SquadMissionKind = 'arena-tempo' | 'field-sync' | 'rival-counter' | 'skill-relay';
export type SquadDrillOutcome = 'clear' | 'flawless' | 'strained';
export type SquadRisk = 'calm' | 'sharp' | 'volatile';
export type SquadDiagnosticKey =
  | 'counterCoverage'
  | 'fieldPlan'
  | 'roleBalance'
  | 'skillRelay'
  | 'tempoControl';

export interface SquadMemberRole {
  digimonId: number;
  name: string;
  role: SquadRole;
  attribute: string;
  field: string;
  power: number;
  focus: string;
  strengths: string[];
  risk: string;
}

export interface SquadDiagnostics {
  roleBalance: number;
  counterCoverage: number;
  fieldPlan: number;
  tempoControl: number;
  skillRelay: number;
  stress: number;
  total: number;
  formation: string;
  openingChain: string[];
  warnings: string[];
}

export interface SquadMission {
  id: string;
  kind: SquadMissionKind;
  title: string;
  objective: string;
  recommendation: string;
  targetAspect: SquadDiagnosticKey;
  risk: SquadRisk;
  difficulty: number;
  rewardBits: number;
  masteryTrack: MasteryTrack;
  tags: string[];
}

export interface SquadLabPlan {
  roles: SquadMemberRole[];
  diagnostics: SquadDiagnostics;
  missions: SquadMission[];
  score: TeamScore;
}

export interface SquadDrillResult {
  mission: SquadMission;
  outcome: SquadDrillOutcome;
  score: number;
  rewardBits: number;
  masteryTrack: MasteryTrack;
  masteryAmount: number;
  teamScore: number;
  roles: SquadMemberRole[];
  recap: string;
  nextHook: string;
}

const STAT_LABELS: Record<keyof BattleStats, string> = {
  attack: 'Attack',
  defense: 'Defense',
  hp: 'HP',
  speed: 'Speed',
  spirit: 'Spirit',
  technique: 'Technique',
};

export function createSquadLabPlan(team: Digimon[], seed = dayIndex()): SquadLabPlan {
  const roles = team.map(squadMemberRole);
  const diagnostics = squadDiagnostics(team, roles);
  return {
    roles,
    diagnostics,
    missions: squadMissions(team, diagnostics, seed),
    score: scoreTeam(team),
  };
}

export function squadMemberRole(digimon: Digimon): SquadMemberRole {
  const stats = deriveStats(digimon);
  const sortedStats = Object.entries(stats).sort((a, b) => b[1] - a[1]) as [keyof BattleStats, number][];
  const skills = deriveSkills(digimon);
  const role = roleFor(digimon, stats);
  const strengths = sortedStats.slice(0, 2).map(([key, value]) => `${STAT_LABELS[key]} ${value}`);
  return {
    digimonId: digimon.id,
    name: digimon.name,
    role,
    attribute: primaryAttribute(digimon),
    field: digimon.fields[0]?.name ?? 'Unknown Field',
    power: statTotal(stats),
    focus: focusFor(role, skills[0]?.tags[0] ?? 'Data'),
    strengths,
    risk: riskForMember(role, stats, skills.length),
  };
}

export function squadDiagnostics(team: Digimon[], roles = team.map(squadMemberRole)): SquadDiagnostics {
  if (!team.length) {
    return {
      roleBalance: 0,
      counterCoverage: 0,
      fieldPlan: 0,
      tempoControl: 0,
      skillRelay: 0,
      stress: 100,
      total: 0,
      formation: 'Empty team',
      openingChain: [],
      warnings: ['Add Digimon before running team drills.'],
    };
  }

  const attributes = team.map(primaryAttribute);
  const fields = team.flatMap((member) => member.fields.map((field) => field.name));
  const skillTags = team.flatMap((member) => deriveSkills(member).flatMap((skill) => skill.tags));
  const stats = team.map(deriveStats);
  const uniqueRoles = new Set(roles.map((role) => role.role)).size;
  const uniqueFields = new Set(fields).size;
  const dominantField = maxCount(fields);
  const attributeSet = new Set(attributes);
  const triangle = attributeSet.has('Data') && attributeSet.has('Virus') && attributeSet.has('Vaccine');
  const avgTempo = average(stats.map((stat) => stat.speed + stat.technique));
  const avgSkillCount = average(team.map((member) => Math.max(1, member.skills.length)));
  const nexus = analyzeDigiLink(team);

  const roleBalance = clamp(uniqueRoles * 19 + Math.min(18, team.length * 5));
  const counterCoverage = clamp(
    (attributeSet.has('Vaccine') ? 22 : 0) +
      (attributeSet.has('Virus') ? 22 : 0) +
      (attributeSet.has('Data') ? 22 : 0) +
      ([...attributeSet].some((attribute) => attribute === 'Free' || attribute === 'Variable') ? 14 : 0) +
      (triangle ? 22 : 0),
  );
  const fieldPlan = clamp((dominantField / team.length) * 70 + Math.min(24, uniqueFields * 6));
  const tempoControl = clamp(avgTempo / 2.65 + (roles.some((role) => role.role === 'Scout') ? 8 : 0));
  const skillRelay = clamp(new Set(skillTags).size * 12 + avgSkillCount * 7);
  const warnings = [
    ...(uniqueRoles < Math.min(3, team.length) ? ['Role spread is narrow. Add a clearer anchor, scout or support lane.'] : []),
    ...(counterCoverage < 58 ? ['Counter coverage is thin against the Vaccine/Virus/Data triangle.'] : []),
    ...(fieldPlan < 52 ? ['No reliable Field core is formed yet.'] : []),
    ...(skillRelay < 48 ? ['Skill relay has too few distinct tags.'] : []),
    ...nexus.warnings.slice(0, 2),
  ];
  const stress = clamp(warnings.length * 14 + Math.max(0, 58 - nexus.score) * 0.7);
  const total = clamp(
    roleBalance * 0.18 +
      counterCoverage * 0.22 +
      fieldPlan * 0.18 +
      tempoControl * 0.18 +
      skillRelay * 0.18 +
      (100 - stress) * 0.06,
  );

  return {
    roleBalance,
    counterCoverage,
    fieldPlan,
    tempoControl,
    skillRelay,
    stress,
    total,
    formation: formationFor(roles, fields, triangle),
    openingChain: openingChainFor(team),
    warnings: warnings.length ? [...new Set(warnings)].slice(0, 5) : ['Squad lanes are stable enough for advanced drills.'],
  };
}

export function runSquadDrill(mission: SquadMission, team: Digimon[], seed = dayIndex()): SquadDrillResult {
  const plan = createSquadLabPlan(team, seed);
  const aspectScore = plan.diagnostics[mission.targetAspect];
  const rng = mulberry32(seed + mission.difficulty + mission.id.length + plan.score.total);
  const score = clamp(
    aspectScore * 0.54 +
      plan.diagnostics.total * 0.24 +
      plan.score.total * 0.12 +
      rng() * 28 -
      mission.difficulty * 0.15 -
      plan.diagnostics.stress * 0.12,
  );
  const outcome: SquadDrillOutcome = score >= 82 ? 'flawless' : score >= 52 ? 'clear' : 'strained';
  const rewardBits = rewardFor(mission, outcome, score);
  return {
    mission,
    outcome,
    score,
    rewardBits,
    masteryTrack: mission.masteryTrack,
    masteryAmount: outcome === 'flawless' ? 13 : outcome === 'clear' ? 8 : 4,
    teamScore: plan.score.total,
    roles: plan.roles,
    recap: recapFor(mission, outcome, plan),
    nextHook: nextHookFor(mission, outcome, plan.diagnostics),
  };
}

export function squadDrillSuccessRate(results: { outcome: SquadDrillOutcome }[]): number {
  if (!results.length) return 0;
  return Math.round((results.filter((result) => result.outcome !== 'strained').length / results.length) * 100);
}

function squadMissions(team: Digimon[], diagnostics: SquadDiagnostics, seed: number): SquadMission[] {
  const idBase = team.map((member) => member.id).join('-') || 'empty';
  return [
    mission(
      `rival-${idBase}-${seed}`,
      'rival-counter',
      'Rival Counter Drill',
      'Read the counter lane before the enemy bracket locks tempo.',
      'Add Vaccine/Data/Virus coverage or a Free stabilizer.',
      'counterCoverage',
      diagnostics.counterCoverage,
      'tactics',
      ['rival', 'counter', 'triangle'],
    ),
    mission(
      `field-${idBase}-${seed}`,
      'field-sync',
      'Field Sync Drill',
      'Hold a shared biome signal long enough to open an expedition route.',
      'Pair at least two Digimon with the same Field.',
      'fieldPlan',
      diagnostics.fieldPlan,
      'field',
      ['field', 'expedition', 'hazard'],
    ),
    mission(
      `skill-${idBase}-${seed}`,
      'skill-relay',
      'Skill Relay Drill',
      'Chain tags into a clean opener, guard beat and finisher window.',
      'Mix elemental, physical and support skill tags.',
      'skillRelay',
      diagnostics.skillRelay,
      'skill',
      ['skill', 'combo', 'forge'],
    ),
    mission(
      `tempo-${idBase}-${seed}`,
      'arena-tempo',
      'Arena Tempo Drill',
      'Practice first-turn focus, guard timing and closing pressure.',
      'Raise Speed, Technique and role spread before entering Arena.',
      'tempoControl',
      diagnostics.tempoControl,
      'arena',
      ['arena', 'initiative', 'guard'],
    ),
  ];
}

function mission(
  id: string,
  kind: SquadMissionKind,
  title: string,
  objective: string,
  recommendation: string,
  targetAspect: SquadDiagnosticKey,
  aspectScore: number,
  masteryTrack: MasteryTrack,
  tags: string[],
): SquadMission {
  const risk = riskForAspect(aspectScore);
  const difficulty = clamp(42 + riskPenalty(risk) + Math.max(0, 65 - aspectScore) * 0.5);
  return {
    id,
    kind,
    title,
    objective,
    recommendation,
    targetAspect,
    risk,
    difficulty,
    rewardBits: 24 + Math.round(difficulty * 0.72) + riskPenalty(risk),
    masteryTrack,
    tags,
  };
}

function roleFor(digimon: Digimon, stats: BattleStats): SquadRole {
  if (digimon.xAntibody || digimon.skills.length >= 5) return 'Specialist';
  if (stats.attack + stats.technique >= stats.hp + stats.defense + 26) return 'Vanguard';
  if (stats.hp + stats.defense >= stats.speed + stats.technique + 34) return 'Anchor';
  if (stats.speed >= Math.max(stats.attack, stats.defense, stats.spirit)) return 'Scout';
  if (stats.spirit + stats.technique >= stats.attack + stats.speed) return 'Support';
  return 'Vanguard';
}

function focusFor(role: SquadRole, tag: string): string {
  if (role === 'Anchor') return `Guard ${tag} lanes`;
  if (role === 'Scout') return `Open with ${tag} tempo`;
  if (role === 'Specialist') return `Convert ${tag} spikes`;
  if (role === 'Support') return `Stabilize ${tag} relay`;
  return `Pressure ${tag} targets`;
}

function riskForMember(role: SquadRole, stats: BattleStats, skillCount: number): string {
  if (role === 'Anchor' && stats.speed < 72) return 'Can be outpaced by tempo teams.';
  if (role === 'Scout' && stats.defense < 72) return 'Needs guard support after first contact.';
  if (role === 'Specialist' && skillCount < 3) return 'Specialist lane wants more skill data.';
  if (role === 'Support' && stats.attack < 78) return 'May struggle to close KOs alone.';
  if (role === 'Vanguard' && stats.spirit < 72) return 'Burst plan can wobble under debuffs.';
  return 'No major role risk detected.';
}

function formationFor(roles: SquadMemberRole[], fields: string[], triangle: boolean): string {
  const dominantField = topValue(fields);
  if (!roles.length) return 'Empty team';
  if (triangle && dominantField) return `${dominantField} Triangle Formation`;
  if (roles.some((role) => role.role === 'Anchor') && roles.some((role) => role.role === 'Scout')) return 'Guard-Tempo Split';
  if (roles.filter((role) => role.role === 'Vanguard').length >= 2) return 'Burst Frontline';
  if (dominantField) return `${dominantField} Field Core`;
  return 'Adaptive Data Stack';
}

function openingChainFor(team: Digimon[]): string[] {
  return team
    .flatMap((member) =>
      deriveSkills(member)
        .slice(0, 1)
        .map((skill) => `${member.name}: ${skill.name}`),
    )
    .slice(0, 4);
}

function riskForAspect(score: number): SquadRisk {
  if (score >= 72) return 'calm';
  if (score >= 46) return 'sharp';
  return 'volatile';
}

function riskPenalty(risk: SquadRisk): number {
  if (risk === 'volatile') return 24;
  if (risk === 'sharp') return 12;
  return 4;
}

function rewardFor(mission: SquadMission, outcome: SquadDrillOutcome, score: number): number {
  if (outcome === 'flawless') return mission.rewardBits + Math.round(score / 3);
  if (outcome === 'clear') return mission.rewardBits + Math.round(score / 6);
  return Math.round(mission.rewardBits * 0.42);
}

function recapFor(mission: SquadMission, outcome: SquadDrillOutcome, plan: SquadLabPlan): string {
  const lead = plan.roles[0]?.name ?? 'The squad';
  if (outcome === 'flawless') {
    return `${lead} turned ${mission.title} into a flawless ${plan.diagnostics.formation} showcase.`;
  }
  if (outcome === 'clear') {
    return `${mission.title} cleared with ${plan.diagnostics.formation}; the squad learned a usable route.`;
  }
  return `${mission.title} strained the squad, but exposed the next repair point.`;
}

function nextHookFor(
  mission: SquadMission,
  outcome: SquadDrillOutcome,
  diagnostics: SquadDiagnostics,
): string {
  if (outcome === 'flawless') return `Take this squad into ${mission.masteryTrack === 'arena' ? 'Arena' : 'the next connected system'} now.`;
  if (outcome === 'clear') return `Save the team, then test ${mission.title} pressure in Arena or Nexus.`;
  const warning = diagnostics.warnings[0] ?? mission.recommendation;
  return `${warning} Then rerun ${mission.title}.`;
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxCount(values: string[]): number {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
  return Math.max(0, ...Object.values(counts));
}

function topValue(values: string[]): string | null {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
