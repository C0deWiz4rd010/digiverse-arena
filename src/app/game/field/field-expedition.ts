import type { Digimon, MetaEntry } from '../../core/models/digimon';
import { dayIndex, mulberry32, seededIndex } from '../../core/utils/seed';
import type { MasteryTrack } from '../mastery/digicore-mastery';
import { dataCompleteness, deriveStats, primaryAttribute, statTotal } from '../stats/battle-stats';

export type ExpeditionRisk = 'calm' | 'sharp' | 'volatile';
export type ExpeditionOutcome = 'complete' | 'partial' | 'lost';

export interface FieldExpedition {
  id: string;
  seed: number;
  fieldId: number;
  fieldName: string;
  title: string;
  objective: string;
  hazard: string;
  recommendedAttribute: string;
  risk: ExpeditionRisk;
  threat: number;
  durationTurns: number;
  rewardBits: number;
  tags: string[];
}

export interface ExpeditionTeamFit {
  fieldMatch: number;
  attributeMatch: number;
  power: number;
  dataQuality: number;
  total: number;
  notes: string[];
}

export interface FieldExpeditionResult {
  expedition: FieldExpedition;
  outcome: ExpeditionOutcome;
  score: number;
  rewardBits: number;
  masteryTrack: MasteryTrack;
  masteryAmount: number;
  teamFit: ExpeditionTeamFit;
  discoveries: string[];
  recap: string;
  nextHook: string;
}

const ATTRIBUTES = ['Vaccine', 'Data', 'Virus', 'Free'];
const HAZARDS = [
  'Signal fog reduces scan clarity.',
  'Hostile packets spike every third turn.',
  'Old evolution traces hide under corrupted terrain.',
  'A rival echo is masking the safe route.',
  'Field resonance rewards matching partners.',
];

const OBJECTIVES = [
  'Map the unstable route and recover a clean Field sample.',
  'Extract a lost skill echo before the signal folds.',
  'Escort the scout packet through the hazard layer.',
  'Find the strongest local Digimon trace and tag it.',
  'Stabilize the Field gate for the next Arena run.',
];

export function createFieldExpeditions(fields: MetaEntry[], seed = dayIndex()): FieldExpedition[] {
  const pool = fields.length ? fields : [{ id: 1, name: 'Dragon Roar' }];
  return Array.from({ length: Math.min(6, Math.max(3, pool.length)) }, (_, index) => {
    const field = pool[(seededIndex(seed + index * 13, pool.length) + index) % pool.length];
    const risk = riskFor(seed + field.id + index);
    const recommendedAttribute = ATTRIBUTES[seededIndex(seed + field.id + 31, ATTRIBUTES.length)];
    const threat = 38 + seededIndex(seed + field.id * 7 + index, 64) + riskBonus(risk);
    return {
      id: `field-${field.id}-${seed}-${index}`,
      seed: seed + index,
      fieldId: field.id,
      fieldName: field.name,
      title: titleFor(field.name, risk),
      objective: OBJECTIVES[seededIndex(seed + field.id + index * 5, OBJECTIVES.length)],
      hazard: HAZARDS[seededIndex(seed + field.id + index * 11, HAZARDS.length)],
      recommendedAttribute,
      risk,
      threat,
      durationTurns: 3 + seededIndex(seed + field.id + index, 4),
      rewardBits: 24 + Math.round(threat * 0.7) + riskBonus(risk),
      tags: tagsFor(field.name, risk, recommendedAttribute),
    };
  });
}

export function expeditionTeamFit(expedition: FieldExpedition, team: Digimon[]): ExpeditionTeamFit {
  if (!team.length) {
    return {
      fieldMatch: 0,
      attributeMatch: 0,
      power: 0,
      dataQuality: 0,
      total: 0,
      notes: ['Assign Digimon before entering the route.'],
    };
  }
  const fieldMatches = team.filter((digimon) =>
    digimon.fields.some((field) => field.name.toLowerCase() === expedition.fieldName.toLowerCase()),
  ).length;
  const attributeMatches = team.filter((digimon) => primaryAttribute(digimon) === expedition.recommendedAttribute).length;
  const rawPower = Math.round(team.reduce((sum, digimon) => sum + statTotal(deriveStats(digimon)), 0) / team.length);
  const dataQuality = Math.round(team.reduce((sum, digimon) => sum + dataCompleteness(digimon), 0) / team.length);
  const fieldMatch = Math.round((fieldMatches / team.length) * 100);
  const attributeMatch = Math.round((attributeMatches / team.length) * 100);
  const power = Math.min(100, Math.round(rawPower / 7));
  const total = Math.min(100, Math.round(fieldMatch * 0.32 + attributeMatch * 0.24 + power * 0.28 + dataQuality * 0.16));
  return {
    fieldMatch,
    attributeMatch,
    power,
    dataQuality,
    total,
    notes: fitNotes(expedition, fieldMatches, attributeMatches, team.length, total),
  };
}

export function runFieldExpedition(
  expedition: FieldExpedition,
  team: Digimon[],
  seed = dayIndex(),
): FieldExpeditionResult {
  const teamFit = expeditionTeamFit(expedition, team);
  const rng = mulberry32(seed + expedition.seed + expedition.fieldId + teamFit.total);
  const roll = teamFit.total + Math.round(rng() * 28) - expedition.threat / 4;
  const outcome: ExpeditionOutcome = roll >= 72 ? 'complete' : roll >= 42 ? 'partial' : 'lost';
  const rewardBits = rewardFor(expedition, outcome, teamFit.total);
  const masteryAmount = outcome === 'complete' ? 12 : outcome === 'partial' ? 7 : 3;
  const discoveries = discoveriesFor(expedition, outcome, team, rng);
  return {
    expedition,
    outcome,
    score: Math.max(0, Math.round(roll)),
    rewardBits,
    masteryTrack: 'field',
    masteryAmount,
    teamFit,
    discoveries,
    recap: recapFor(expedition, outcome, teamFit.total, discoveries),
    nextHook: nextHookFor(expedition, outcome),
  };
}

export function expeditionWinRate(results: { outcome: ExpeditionOutcome }[]): number {
  if (!results.length) return 0;
  return Math.round((results.filter((result) => result.outcome === 'complete').length / results.length) * 100);
}

function riskFor(value: number): ExpeditionRisk {
  const index = seededIndex(value, 10);
  if (index >= 8) return 'volatile';
  if (index >= 4) return 'sharp';
  return 'calm';
}

function riskBonus(risk: ExpeditionRisk): number {
  if (risk === 'volatile') return 28;
  if (risk === 'sharp') return 14;
  return 4;
}

function titleFor(fieldName: string, risk: ExpeditionRisk): string {
  if (risk === 'volatile') return `${fieldName} Storm Gate`;
  if (risk === 'sharp') return `${fieldName} Hazard Route`;
  return `${fieldName} Survey Run`;
}

function tagsFor(fieldName: string, risk: ExpeditionRisk, attribute: string): string[] {
  return [fieldName, risk, `${attribute} route`, risk === 'volatile' ? 'bonus anomaly' : 'stable chart'];
}

function fitNotes(
  expedition: FieldExpedition,
  fieldMatches: number,
  attributeMatches: number,
  teamSize: number,
  total: number,
): string[] {
  const notes = [
    `${fieldMatches}/${teamSize} members match ${expedition.fieldName}.`,
    `${attributeMatches}/${teamSize} members match ${expedition.recommendedAttribute}.`,
  ];
  if (total >= 78) notes.push('Route fit is strong enough to chase bonus discoveries.');
  else if (total >= 48) notes.push('Route fit is workable, but risk can still bite.');
  else notes.push('Route fit is fragile. Tune the team before a volatile run.');
  return notes;
}

function rewardFor(expedition: FieldExpedition, outcome: ExpeditionOutcome, fit: number): number {
  if (outcome === 'complete') return expedition.rewardBits + Math.round(fit / 3);
  if (outcome === 'partial') return Math.round(expedition.rewardBits * 0.56);
  return Math.round(expedition.rewardBits * 0.22);
}

function discoveriesFor(
  expedition: FieldExpedition,
  outcome: ExpeditionOutcome,
  team: Digimon[],
  rng: () => number,
): string[] {
  const lead = team[0]?.name ?? 'Scout packet';
  const base = [
    `${lead} tagged a ${expedition.fieldName} resonance point.`,
    `${expedition.recommendedAttribute} pressure opened a clean route fork.`,
  ];
  if (outcome === 'complete') {
    return [...base, `${expedition.title} yielded a bonus artifact cache.`];
  }
  if (outcome === 'partial') {
    return [base[seededIndex(Math.round(rng() * 1000), base.length)], 'The team recovered partial route data.'];
  }
  return ['The route collapsed, but a weak signal was archived for the next run.'];
}

function recapFor(
  expedition: FieldExpedition,
  outcome: ExpeditionOutcome,
  fit: number,
  discoveries: string[],
): string {
  return `${expedition.title} ended as ${outcome} with ${fit}% team fit. ${discoveries[0]}`;
}

function nextHookFor(expedition: FieldExpedition, outcome: ExpeditionOutcome): string {
  if (outcome === 'complete') return `Use the ${expedition.fieldName} route data in Arena or Tournaments.`;
  if (outcome === 'partial') return `Add one ${expedition.recommendedAttribute} member and rerun the route.`;
  return `Build a stronger ${expedition.fieldName} team before entering again.`;
}
