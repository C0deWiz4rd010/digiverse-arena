import type { Digimon, MetaEntry } from '../../core/models/digimon';
import { dayIndex, mulberry32, seededIndex } from '../../core/utils/seed';
import type { MasteryTrack } from '../mastery/digicore-mastery';
import { dataCompleteness, deriveSkills } from '../stats/battle-stats';

export type SkillProgramKind = 'burst' | 'guard' | 'tempo' | 'support' | 'finisher' | 'hybrid';
export type SkillForgeOutcome = 'perfect' | 'stable' | 'fizzle';
export type SkillForgeRisk = 'low' | 'medium' | 'high';

export interface SkillForgeProgram {
  id: string;
  seed: number;
  kind: SkillProgramKind;
  title: string;
  objective: string;
  focusSkill: string;
  targetTag: string;
  risk: SkillForgeRisk;
  requiredAccuracy: number;
  rewardBits: number;
  tags: string[];
}

export interface SkillComboFit {
  tagMatch: number;
  roleMatch: number;
  accuracy: number;
  power: number;
  dataQuality: number;
  total: number;
  notes: string[];
}

export interface SkillForgeResult {
  program: SkillForgeProgram;
  outcome: SkillForgeOutcome;
  comboFit: SkillComboFit;
  score: number;
  rewardBits: number;
  masteryTrack: MasteryTrack;
  masteryAmount: number;
  comboChain: string[];
  coaching: string[];
  recap: string;
  nextHook: string;
}

const PROGRAM_KINDS: SkillProgramKind[] = ['burst', 'guard', 'tempo', 'support', 'finisher', 'hybrid'];
const TAGS = ['Fire', 'Water', 'Light', 'Dark', 'Machine', 'Nature', 'Physical', 'Support', 'Data'];

export function createSkillForgePrograms(skills: MetaEntry[], seed = dayIndex()): SkillForgeProgram[] {
  const pool = skills.length ? skills : [{ id: 1, name: 'Data Pulse' }];
  return Array.from({ length: 6 }, (_, index) => {
    const skill = pool[(seededIndex(seed + index * 17, pool.length) + index) % pool.length];
    const kind = PROGRAM_KINDS[seededIndex(seed + skill.id + index * 5, PROGRAM_KINDS.length)];
    const targetTag = TAGS[seededIndex(seed + skill.id + index * 11, TAGS.length)];
    const risk = riskFor(seed + skill.id + index);
    const requiredAccuracy = 68 + seededIndex(seed + skill.id + 9, 24) + riskBonus(risk);
    const rewardBits = 22 + requiredAccuracy + riskBonus(risk) + index * 2;
    return {
      id: `forge-${skill.id}-${seed}-${index}`,
      seed: seed + index,
      kind,
      title: titleFor(kind, skill.name),
      objective: objectiveFor(kind, targetTag),
      focusSkill: skill.name,
      targetTag,
      risk,
      requiredAccuracy: Math.min(96, requiredAccuracy),
      rewardBits,
      tags: [kind, targetTag, risk, skill.name],
    };
  });
}

export function skillComboFit(program: SkillForgeProgram, team: Digimon[]): SkillComboFit {
  if (!team.length) {
    return {
      tagMatch: 0,
      roleMatch: 0,
      accuracy: 0,
      power: 0,
      dataQuality: 0,
      total: 0,
      notes: ['Assign Digimon before entering the Forge.'],
    };
  }
  const allSkills = team.flatMap((digimon) => deriveSkills(digimon));
  const tagMatches = allSkills.filter((skill) => skill.tags.includes(program.targetTag)).length;
  const roleMatches = allSkills.filter((skill) => roleMatchesProgram(program.kind, skill.kind)).length;
  const avgAccuracy = Math.round(allSkills.reduce((sum, skill) => sum + skill.accuracy, 0) / Math.max(1, allSkills.length));
  const avgPower = Math.round(allSkills.reduce((sum, skill) => sum + skill.power, 0) / Math.max(1, allSkills.length));
  const dataQuality = Math.round(team.reduce((sum, digimon) => sum + dataCompleteness(digimon), 0) / team.length);
  const tagMatch = Math.min(100, Math.round((tagMatches / Math.max(1, allSkills.length)) * 180));
  const roleMatch = Math.min(100, Math.round((roleMatches / Math.max(1, allSkills.length)) * 170));
  const accuracy = Math.min(100, Math.round((avgAccuracy / Math.max(1, program.requiredAccuracy)) * 82));
  const power = Math.min(100, Math.round(avgPower * 1.15));
  const total = Math.min(100, Math.round(tagMatch * 0.28 + roleMatch * 0.24 + accuracy * 0.22 + power * 0.16 + dataQuality * 0.1));
  return {
    tagMatch,
    roleMatch,
    accuracy,
    power,
    dataQuality,
    total,
    notes: fitNotes(program, tagMatches, roleMatches, allSkills.length, total),
  };
}

export function runSkillForge(program: SkillForgeProgram, team: Digimon[], seed = dayIndex()): SkillForgeResult {
  const comboFit = skillComboFit(program, team);
  const rng = mulberry32(seed + program.seed + comboFit.total);
  const score = Math.max(0, Math.round(comboFit.total + rng() * 24 - riskPenalty(program.risk)));
  const outcome: SkillForgeOutcome = score >= 82 ? 'perfect' : score >= 48 ? 'stable' : 'fizzle';
  const comboChain = comboChainFor(program, team, outcome);
  const rewardBits = rewardFor(program, outcome, comboFit.total);
  const masteryAmount = outcome === 'perfect' ? 13 : outcome === 'stable' ? 8 : 3;
  const coaching = coachingFor(program, comboFit, outcome);
  return {
    program,
    outcome,
    comboFit,
    score,
    rewardBits,
    masteryTrack: 'skill',
    masteryAmount,
    comboChain,
    coaching,
    recap: `${program.title} ended ${outcome} with ${comboFit.total}% combo fit.`,
    nextHook: nextHookFor(program, outcome),
  };
}

export function skillForgeWinRate(results: { outcome: SkillForgeOutcome }[]): number {
  if (!results.length) return 0;
  return Math.round((results.filter((result) => result.outcome === 'perfect' || result.outcome === 'stable').length / results.length) * 100);
}

function riskFor(value: number): SkillForgeRisk {
  const roll = seededIndex(value, 10);
  if (roll >= 8) return 'high';
  if (roll >= 4) return 'medium';
  return 'low';
}

function riskBonus(risk: SkillForgeRisk): number {
  if (risk === 'high') return 18;
  if (risk === 'medium') return 9;
  return 2;
}

function riskPenalty(risk: SkillForgeRisk): number {
  if (risk === 'high') return 18;
  if (risk === 'medium') return 9;
  return 2;
}

function titleFor(kind: SkillProgramKind, skillName: string): string {
  if (kind === 'burst') return `${skillName} Burst Drill`;
  if (kind === 'guard') return `${skillName} Guard Loop`;
  if (kind === 'tempo') return `${skillName} Tempo Chain`;
  if (kind === 'support') return `${skillName} Support Sync`;
  if (kind === 'finisher') return `${skillName} Finisher Lab`;
  return `${skillName} Hybrid Forge`;
}

function objectiveFor(kind: SkillProgramKind, tag: string): string {
  if (kind === 'burst') return `Stack ${tag} pressure into a clean opening burst.`;
  if (kind === 'guard') return `Convert ${tag} reads into guard and focus stability.`;
  if (kind === 'tempo') return `Sequence ${tag} skills without losing speed control.`;
  if (kind === 'support') return `Build a ${tag} support loop that survives pressure.`;
  if (kind === 'finisher') return `Bank enough focus for a ${tag} finishing window.`;
  return `Blend ${tag} utility with damage and cooldown discipline.`;
}

function roleMatchesProgram(program: SkillProgramKind, skillKind: string): boolean {
  if (program === 'burst' || program === 'tempo' || program === 'hybrid') return skillKind === 'damage';
  if (program === 'guard' || program === 'support') return skillKind === 'support' || skillKind === 'guard';
  return skillKind === 'finisher' || skillKind === 'damage';
}

function fitNotes(
  program: SkillForgeProgram,
  tagMatches: number,
  roleMatches: number,
  skillCount: number,
  total: number,
): string[] {
  const notes = [
    `${tagMatches}/${skillCount} skills match ${program.targetTag}.`,
    `${roleMatches}/${skillCount} skills fit the ${program.kind} drill.`,
  ];
  if (total >= 78) notes.push('Combo timing is strong enough to chase a perfect clear.');
  else if (total >= 48) notes.push('Combo timing is stable, but one better tag match would help.');
  else notes.push('Forge fit is fragile. Train a better role/tag pairing first.');
  return notes;
}

function comboChainFor(program: SkillForgeProgram, team: Digimon[], outcome: SkillForgeOutcome): string[] {
  const skills = team.flatMap((digimon) => deriveSkills(digimon).map((skill) => `${digimon.name}: ${skill.name}`));
  const base = skills.length ? skills.slice(0, outcome === 'perfect' ? 5 : outcome === 'stable' ? 4 : 3) : ['Data Pulse'];
  return outcome === 'perfect' ? [...base, `${program.focusSkill}: Overwrite Finish`] : base;
}

function rewardFor(program: SkillForgeProgram, outcome: SkillForgeOutcome, fit: number): number {
  if (outcome === 'perfect') return program.rewardBits + Math.round(fit / 2);
  if (outcome === 'stable') return Math.round(program.rewardBits * 0.65);
  return Math.round(program.rewardBits * 0.24);
}

function coachingFor(program: SkillForgeProgram, fit: SkillComboFit, outcome: SkillForgeOutcome): string[] {
  const coaching = [
    `Target tag: ${program.targetTag}. Current tag fit ${fit.tagMatch}%.`,
    `Role timing: ${fit.roleMatch}%. Required accuracy ${program.requiredAccuracy}.`,
  ];
  if (outcome === 'perfect') coaching.push('Keep this chain for Rival and Tournament pressure windows.');
  else if (outcome === 'stable') coaching.push('Add one matching skill tag to convert stable into perfect.');
  else coaching.push('Use Skill Library and Team Builder to find a cleaner role pairing.');
  return coaching;
}

function nextHookFor(program: SkillForgeProgram, outcome: SkillForgeOutcome): string {
  if (outcome === 'perfect') return `${program.title} is Arena-ready. Test it in a command battle.`;
  if (outcome === 'stable') return `Run ${program.kind} once more after tuning tags.`;
  return `Open Skill Library, filter for ${program.targetTag}, and rebuild the chain.`;
}
