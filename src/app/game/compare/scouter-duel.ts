import type { Digimon } from '../../core/models/digimon';
import { dayIndex, mulberry32 } from '../../core/utils/seed';
import type { MasteryTrack } from '../mastery/digicore-mastery';
import {
  dataCompleteness,
  deriveSkills,
  deriveStats,
  primaryAttribute,
  rarityScore,
  statTotal,
  type BattleStats,
} from '../stats/battle-stats';

export type ScouterScenarioKind = 'arena-read' | 'field-hazard' | 'rival-pressure' | 'underdog-upset';
export type ScouterRisk = 'calm' | 'sharp' | 'volatile';
export type ScouterOutcome = 'hit' | 'miss' | 'perfect-read';

export interface ScouterFocus {
  attribute: number;
  data: number;
  field: number;
  guard: number;
  power: number;
  rarity: number;
  skill: number;
  tempo: number;
}

export interface ScouterScenario {
  id: string;
  kind: ScouterScenarioKind;
  title: string;
  objective: string;
  risk: ScouterRisk;
  difficulty: number;
  rewardBits: number;
  focus: ScouterFocus;
  tags: string[];
}

export interface ScouterCandidate {
  digimonId: number;
  name: string;
  attribute: string;
  field: string;
  role: string;
  power: number;
  rarity: number;
  dataQuality: number;
  tempo: number;
  guard: number;
  skillScore: number;
  fieldScore: number;
  attributeScore: number;
  scenarioScore: number;
  winOdds: number;
  skillHook: string;
  notes: string[];
}

export interface ScouterDuelPlan {
  scenario: ScouterScenario;
  candidates: ScouterCandidate[];
  winnerId: number | null;
  confidence: number;
  margin: number;
  spread: number;
  notes: string[];
}

export interface ScouterDuelResult {
  scenario: ScouterScenario;
  predictedId: number;
  predictedName: string;
  winnerId: number | null;
  winnerName: string;
  outcome: ScouterOutcome;
  confidence: number;
  margin: number;
  rewardBits: number;
  masteryTrack: MasteryTrack;
  masteryAmount: number;
  recap: string;
  nextHook: string;
  candidates: ScouterCandidate[];
}

const EMPTY_FOCUS: ScouterFocus = {
  attribute: 0,
  data: 0,
  field: 0,
  guard: 0,
  power: 0,
  rarity: 0,
  skill: 0,
  tempo: 0,
};

export function createScouterScenarios(seed = dayIndex()): ScouterScenario[] {
  return [
    scenario(
      `arena-read-${seed}`,
      'arena-read',
      'Arena Read',
      'Find the cleanest neutral opener before the Arena gate lights up.',
      'calm',
      42,
      { power: 28, tempo: 20, guard: 14, skill: 16, rarity: 12, data: 10 },
      ['arena', 'tempo', 'neutral'],
    ),
    scenario(
      `rival-pressure-${seed}`,
      'rival-pressure',
      'Rival Pressure',
      'Call the Digimon that survives counter pressure and turns the triangle.',
      'sharp',
      58,
      { attribute: 28, guard: 20, power: 16, skill: 16, tempo: 10, data: 10 },
      ['rival', 'counter', 'guard'],
    ),
    scenario(
      `field-hazard-${seed}`,
      'field-hazard',
      'Field Hazard',
      'Pick the profile that reads the Field, keeps data stable and exits clean.',
      'sharp',
      62,
      { field: 25, data: 20, guard: 16, skill: 15, power: 14, rarity: 10 },
      ['field', 'hazard', 'data'],
    ),
    scenario(
      `underdog-upset-${seed}`,
      'underdog-upset',
      'Underdog Upset',
      'Spot the sleeper pick whose rare skill line can flip the obvious favorite.',
      'volatile',
      74,
      { rarity: 23, skill: 22, tempo: 18, data: 14, attribute: 13, power: 10 },
      ['upset', 'skill', 'rarity'],
    ),
  ];
}

export function createScouterDuelPlan(
  digimon: Digimon[],
  scenario: ScouterScenario = createScouterScenarios()[0],
  seed = dayIndex(),
): ScouterDuelPlan {
  if (!digimon.length) {
    return {
      scenario,
      candidates: [],
      winnerId: null,
      confidence: 0,
      margin: 0,
      spread: 0,
      notes: ['Load Digimon before making a Scouter call.'],
    };
  }
  const scored = digimon.map((candidate) => scoreCandidate(candidate, scenario, seed));
  const totalScore = scored.reduce((sum, candidate) => sum + candidate.scenarioScore, 0);
  const candidates = scored
    .map((candidate) => ({
      ...candidate,
      winOdds: Math.max(1, Math.round((candidate.scenarioScore / Math.max(1, totalScore)) * 100)),
    }))
    .sort((a, b) => b.scenarioScore - a.scenarioScore);
  const leader = candidates[0];
  const runnerUp = candidates[1];
  const margin = leader ? leader.scenarioScore - (runnerUp?.scenarioScore ?? 0) : 0;
  const spread = candidates.length ? candidates[0].scenarioScore - candidates[candidates.length - 1].scenarioScore : 0;
  return {
    scenario,
    candidates,
    winnerId: leader?.digimonId ?? null,
    confidence: clamp(52 + margin * 1.5 + Math.min(14, spread / 3) - riskPenalty(scenario.risk) * 0.28),
    margin,
    spread,
    notes: planNotes(scenario, candidates, margin),
  };
}

export function resolveScouterDuel(
  digimon: Digimon[],
  scenario: ScouterScenario,
  predictedId: number,
  seed = dayIndex(),
): ScouterDuelResult {
  const plan = createScouterDuelPlan(digimon, scenario, seed);
  const predicted = plan.candidates.find((candidate) => candidate.digimonId === predictedId) ?? plan.candidates[0];
  const winner = plan.candidates[0];
  const hit = Boolean(predicted && winner && predicted.digimonId === winner.digimonId);
  const outcome: ScouterOutcome = hit && plan.confidence >= 72 ? 'perfect-read' : hit ? 'hit' : 'miss';
  return {
    scenario,
    predictedId: predicted?.digimonId ?? predictedId,
    predictedName: predicted?.name ?? 'Unknown Signal',
    winnerId: winner?.digimonId ?? null,
    winnerName: winner?.name ?? 'No Winner',
    outcome,
    confidence: plan.confidence,
    margin: plan.margin,
    rewardBits: rewardFor(scenario, outcome, plan.confidence),
    masteryTrack: 'tactics',
    masteryAmount: outcome === 'perfect-read' ? 12 : outcome === 'hit' ? 8 : 3,
    recap: recapFor(scenario, outcome, predicted?.name ?? 'Unknown Signal', winner?.name ?? 'No Winner', plan.margin),
    nextHook: nextHookFor(outcome, scenario, winner),
    candidates: plan.candidates,
  };
}

export function scouterHitRate(results: { outcome: ScouterOutcome }[]): number {
  if (!results.length) return 0;
  return Math.round((results.filter((result) => result.outcome !== 'miss').length / results.length) * 100);
}

function scenario(
  id: string,
  kind: ScouterScenarioKind,
  title: string,
  objective: string,
  risk: ScouterRisk,
  difficulty: number,
  focus: Partial<ScouterFocus>,
  tags: string[],
): ScouterScenario {
  return {
    id,
    kind,
    title,
    objective,
    risk,
    difficulty,
    rewardBits: 26 + Math.round(difficulty * 0.76) + riskPenalty(risk),
    focus: { ...EMPTY_FOCUS, ...focus },
    tags,
  };
}

function scoreCandidate(digimon: Digimon, scenario: ScouterScenario, seed: number): ScouterCandidate {
  const stats = deriveStats(digimon);
  const skills = deriveSkills(digimon);
  const attribute = primaryAttribute(digimon);
  const field = digimon.fields[0]?.name ?? 'Unknown Field';
  const power = clamp(statTotal(stats) / 8);
  const rarity = clamp(rarityScore(digimon));
  const dataQuality = dataCompleteness(digimon);
  const tempo = clamp((stats.speed + stats.technique) / 2.7);
  const guard = clamp((stats.hp + stats.defense + stats.spirit) / 4.7);
  const skillScore = clamp(average(skills.map((skill) => skill.power)) / 1.25 + new Set(skills.flatMap((skill) => skill.tags)).size * 7);
  const fieldScore = clamp(digimon.fields.length * 18 + (field === 'Unknown Field' ? 0 : 28));
  const attributeScore = attributeStrength(attribute, scenario.kind);
  const jitter = Math.round(mulberry32(seed + digimon.id * 17 + scenario.id.length)() * 5);
  const focus = scenario.focus;
  const scenarioScore = clamp(
    power * focus.power * 0.01 +
      rarity * focus.rarity * 0.01 +
      dataQuality * focus.data * 0.01 +
      tempo * focus.tempo * 0.01 +
      guard * focus.guard * 0.01 +
      skillScore * focus.skill * 0.01 +
      fieldScore * focus.field * 0.01 +
      attributeScore * focus.attribute * 0.01 +
      baseScenarioBias(scenario.kind, stats, digimon.skills.length) +
      jitter,
  );
  return {
    digimonId: digimon.id,
    name: digimon.name,
    attribute,
    field,
    role: roleFor(stats, digimon.skills.length, digimon.xAntibody),
    power,
    rarity,
    dataQuality,
    tempo,
    guard,
    skillScore,
    fieldScore,
    attributeScore,
    scenarioScore,
    winOdds: 0,
    skillHook: skills[0]?.name ?? `${digimon.name} Pulse`,
    notes: candidateNotes(scenario, attribute, field, skills[0]?.tags[0] ?? 'Data', scenarioScore),
  };
}

function roleFor(stats: BattleStats, skillCount: number, xAntibody: boolean): string {
  if (xAntibody || skillCount >= 5) return 'Specialist';
  if (stats.attack + stats.technique > stats.hp + stats.defense + 24) return 'Burst Pick';
  if (stats.hp + stats.defense > stats.speed + stats.technique + 28) return 'Safe Anchor';
  if (stats.speed > Math.max(stats.attack, stats.defense, stats.spirit)) return 'Tempo Scout';
  if (stats.spirit + stats.technique > stats.attack + stats.speed) return 'Control Read';
  return 'Flex Contender';
}

function attributeStrength(attribute: string, kind: ScouterScenarioKind): number {
  const base = attribute === 'Free' || attribute === 'Variable' ? 68 : attribute === 'Unknown' ? 46 : 74;
  if (kind === 'rival-pressure' && (attribute === 'Vaccine' || attribute === 'Data' || attribute === 'Virus')) return base + 16;
  if (kind === 'underdog-upset' && (attribute === 'Free' || attribute === 'Variable')) return base + 12;
  return base;
}

function baseScenarioBias(kind: ScouterScenarioKind, stats: BattleStats, skillCount: number): number {
  if (kind === 'arena-read') return Math.min(14, (stats.speed + stats.attack) / 34);
  if (kind === 'rival-pressure') return Math.min(15, (stats.defense + stats.spirit) / 32);
  if (kind === 'field-hazard') return Math.min(12, (stats.hp + stats.spirit) / 38);
  return Math.min(16, stats.technique / 12 + skillCount * 1.5);
}

function candidateNotes(
  scenario: ScouterScenario,
  attribute: string,
  field: string,
  tag: string,
  score: number,
): string[] {
  const lead = score >= 72 ? 'Strong read' : score >= 52 ? 'Playable read' : 'Risky read';
  return [
    `${lead} for ${scenario.title}.`,
    `${attribute} lane with ${field} field context.`,
    `${tag} skill hook can swing the call.`,
  ];
}

function planNotes(scenario: ScouterScenario, candidates: ScouterCandidate[], margin: number): string[] {
  const leader = candidates[0];
  if (!leader) return ['No candidates loaded.'];
  return [
    `${leader.name} leads ${scenario.title} by ${margin} points.`,
    margin >= 16 ? 'Confidence is high enough to chase bonus bits.' : 'Margin is close; inspect role and skill hooks before calling.',
    scenario.risk === 'volatile' ? 'Volatile scenarios reward brave reads but punish lazy favorites.' : 'Scenario pressure is readable.',
  ];
}

function recapFor(
  scenario: ScouterScenario,
  outcome: ScouterOutcome,
  predictedName: string,
  winnerName: string,
  margin: number,
): string {
  if (outcome === 'perfect-read') {
    return `${predictedName} was the perfect ${scenario.title} call and won by ${margin} scouter points.`;
  }
  if (outcome === 'hit') {
    return `${predictedName} matched the Scouter winner in ${scenario.title}.`;
  }
  return `${predictedName} missed the read; ${winnerName} had the cleaner ${scenario.title} line.`;
}

function nextHookFor(outcome: ScouterOutcome, scenario: ScouterScenario, winner?: ScouterCandidate): string {
  if (outcome === 'perfect-read') return `Take ${winner?.name ?? 'the winner'} into Arena while the read is hot.`;
  if (outcome === 'hit') return `Save the lesson, then test ${scenario.title} logic in Squad Lab.`;
  return `Recheck ${winner?.role ?? 'the winning role'} signals before the next call.`;
}

function rewardFor(scenario: ScouterScenario, outcome: ScouterOutcome, confidence: number): number {
  if (outcome === 'perfect-read') return scenario.rewardBits + Math.round(confidence / 2);
  if (outcome === 'hit') return scenario.rewardBits + Math.round(confidence / 5);
  return Math.round(scenario.rewardBits * 0.28);
}

function riskPenalty(risk: ScouterRisk): number {
  if (risk === 'volatile') return 24;
  if (risk === 'sharp') return 12;
  return 4;
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
