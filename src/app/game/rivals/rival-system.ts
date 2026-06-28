import type { Digimon } from '../../core/models/digimon';
import { dayIndex, seededIndex } from '../../core/utils/seed';
import { analyzeDigiLink, combatTuningFromProfile } from '../nexus/digilink-nexus';
import { deriveSkills, deriveStats, primaryAttribute, rarityScore, statTotal } from '../stats/battle-stats';
import { battleSummary, simulateBattle, type BattleResult } from '../battle-engine/battle-engine';
import type { MasteryTrack } from '../mastery/digicore-mastery';

export type RivalIntent = 'rushdown' | 'fortress' | 'hex' | 'overclock';
export type RivalTier = 'Spark' | 'Volt' | 'Overdrive' | 'Apex';
export type RivalOutcome = 'clear' | 'escaped' | 'standoff';

export interface RivalPhase {
  id: string;
  title: string;
  detail: string;
  pressure: number;
  rewardBits: number;
}

export interface RivalSignal {
  id: string;
  seed: number;
  rivalId: number;
  rivalName: string;
  rivalImage: string | null;
  attribute: string;
  field: string;
  tier: RivalTier;
  intent: RivalIntent;
  threat: number;
  bountyBits: number;
  weakness: string;
  counterAttribute: string;
  recommendedProtocol: string;
  scoutQuestion: string;
  scoutChoices: string[];
  scoutAnswer: string;
  taunt: string;
  mutators: string[];
  phases: RivalPhase[];
}

export interface RivalDuelResult {
  signal: RivalSignal;
  result: BattleResult;
  outcome: RivalOutcome;
  rewardBits: number;
  masteryTrack: MasteryTrack;
  masteryAmount: number;
  counterCorrect: boolean;
  counterAttribute: string;
  recap: string;
  nextHook: string;
}

const INTENTS: RivalIntent[] = ['rushdown', 'fortress', 'hex', 'overclock'];
const ATTRIBUTES = ['Vaccine', 'Data', 'Virus', 'Free'];

export function createRivalSignal(rival: Digimon, seed = dayIndex()): RivalSignal {
  const stats = deriveStats(rival);
  const total = statTotal(stats);
  const attribute = primaryAttribute(rival);
  const field = rival.fields[0]?.name ?? 'Unknown Field';
  const intent = INTENTS[seededIndex(seed + rival.id, INTENTS.length)];
  const tier = tierFromThreat(total + rarityScore(rival));
  const threat = Math.min(999, Math.round(total / 2 + rarityScore(rival) * 2.2));
  const counterAttribute = counterFor(attribute);
  const skill = deriveSkills(rival)[0];
  const bountyBits = Math.round(42 + threat / 12 + tierBonus(tier) + (rival.xAntibody ? 18 : 0));
  return {
    id: `rival-${rival.id}-${seed}`,
    seed,
    rivalId: rival.id,
    rivalName: rival.name,
    rivalImage: rival.image,
    attribute,
    field,
    tier,
    intent,
    threat,
    bountyBits,
    weakness: weaknessFor(attribute, intent, field),
    counterAttribute,
    recommendedProtocol: protocolFor(intent, field),
    scoutQuestion: `Which counter lane pressures ${attribute} before ${rival.name} stabilizes?`,
    scoutChoices: rotateChoices(ATTRIBUTES, counterAttribute, seed + rival.id),
    scoutAnswer: counterAttribute,
    taunt: tauntFor(rival.name, intent, skill?.name ?? `${rival.name} Pulse`),
    mutators: mutatorsFor(intent, tier, field),
    phases: phasesFor(rival.name, intent, bountyBits),
  };
}

export function runRivalDuel(
  signal: RivalSignal,
  playerTeam: Digimon[],
  enemyTeam: Digimon[],
  counterAttribute: string,
): RivalDuelResult {
  const counterCorrect = counterAttribute === signal.scoutAnswer || teamHasCounter(playerTeam, signal.counterAttribute);
  const counterScore = counterCorrect ? 16 : -8;
  const playerProfile = analyzeDigiLink(playerTeam);
  const enemyProfile = analyzeDigiLink(enemyTeam);
  const result = simulateBattle(playerTeam, enemyTeam, {
    mode: `Rival Signal: ${signal.rivalName}`,
    arenaField: signal.field,
    seed: signal.seed + signal.threat + counterScore,
    playerNexus: combatTuningFromProfile(playerProfile),
    enemyNexus: combatTuningFromProfile(enemyProfile),
    maxTurns: 80,
  });
  const outcome = result.winner === 'player' ? 'clear' : result.winner === 'enemy' ? 'escaped' : 'standoff';
  const rewardBits = rewardFor(signal, outcome, counterCorrect);
  return {
    signal,
    result,
    outcome,
    rewardBits,
    masteryTrack: outcome === 'clear' ? 'tactics' : 'scan',
    masteryAmount: outcome === 'clear' ? (counterCorrect ? 14 : 9) : 4,
    counterCorrect,
    counterAttribute,
    recap: recapFor(signal, result, counterCorrect),
    nextHook: nextHookFor(outcome, signal),
  };
}

export function rivalScoreLine(signal: RivalSignal): string {
  return `${signal.tier} ${signal.intent} signal - ${signal.threat} threat - ${signal.bountyBits} bounty bits.`;
}

export function rivalWinRate(results: { outcome: RivalOutcome }[]): number {
  if (!results.length) return 0;
  return Math.round((results.filter((result) => result.outcome === 'clear').length / results.length) * 100);
}

function tierFromThreat(value: number): RivalTier {
  if (value >= 760) return 'Apex';
  if (value >= 620) return 'Overdrive';
  if (value >= 480) return 'Volt';
  return 'Spark';
}

function tierBonus(tier: RivalTier): number {
  if (tier === 'Apex') return 48;
  if (tier === 'Overdrive') return 32;
  if (tier === 'Volt') return 18;
  return 8;
}

function counterFor(attribute: string): string {
  if (attribute === 'Virus') return 'Vaccine';
  if (attribute === 'Data') return 'Virus';
  if (attribute === 'Vaccine') return 'Data';
  return 'Free';
}

function teamHasCounter(team: Digimon[], counterAttribute: string): boolean {
  return team.some((digimon) => primaryAttribute(digimon) === counterAttribute);
}

function weaknessFor(attribute: string, intent: RivalIntent, field: string): string {
  const counter = counterFor(attribute);
  if (intent === 'rushdown') return `${counter} openers and speed control break the first two turns.`;
  if (intent === 'fortress') return `${counter} pressure plus Field denial prevents guard stacking in ${field}.`;
  if (intent === 'hex') return `${counter} burst damage is safer than long support loops.`;
  return `${counter} counters and Nexus focus keep the overclock window short.`;
}

function protocolFor(intent: RivalIntent, field: string): string {
  if (intent === 'rushdown') return 'Tempo Scout';
  if (intent === 'fortress') return `Field Core: ${field}`;
  if (intent === 'hex') return 'Cleanse Burst';
  return 'Nexus Overdrive';
}

function tauntFor(name: string, intent: RivalIntent, skillName: string): string {
  if (intent === 'rushdown') return `${name} opens with ${skillName} and dares you to answer before turn three.`;
  if (intent === 'fortress') return `${name} locks the arena and turns every weak hit into free focus.`;
  if (intent === 'hex') return `${name} is reading your archive notes and punishing predictable teams.`;
  return `${name} overclocks the signal. Win fast or the duel becomes a storm.`;
}

function mutatorsFor(intent: RivalIntent, tier: RivalTier, field: string): string[] {
  const base =
    intent === 'rushdown'
      ? ['Opening speed surge', 'Low HP finisher bias']
      : intent === 'fortress'
        ? ['Guard pressure', `${field} field lock`]
        : intent === 'hex'
          ? ['Accuracy tax', 'Counter-read bonus']
          : ['Focus spikes', 'Reward volatility'];
  return tier === 'Apex' ? [...base, 'Apex rematch clause'] : base;
}

function phasesFor(name: string, intent: RivalIntent, bountyBits: number): RivalPhase[] {
  return [
    {
      id: 'trace',
      title: 'Trace Signal',
      detail: `${name} leaks enough metadata for one clean counter call.`,
      pressure: intent === 'hex' ? 72 : 54,
      rewardBits: Math.round(bountyBits * 0.18),
    },
    {
      id: 'duel',
      title: 'Duel Window',
      detail: `Enter before the signal rotates and the rival team gains extra focus.`,
      pressure: intent === 'rushdown' ? 86 : 68,
      rewardBits: Math.round(bountyBits * 0.52),
    },
    {
      id: 'claim',
      title: 'Bounty Claim',
      detail: `Clear the duel to bank mastery, archive the result and unlock the rematch read.`,
      pressure: intent === 'overclock' ? 94 : 76,
      rewardBits: Math.round(bountyBits * 0.3),
    },
  ];
}

function rewardFor(signal: RivalSignal, outcome: RivalOutcome, counterCorrect: boolean): number {
  if (outcome === 'clear') return signal.bountyBits + (counterCorrect ? 18 : 0);
  if (outcome === 'standoff') return Math.round(signal.bountyBits * 0.42);
  return Math.round(signal.bountyBits * 0.22);
}

function recapFor(signal: RivalSignal, result: BattleResult, counterCorrect: boolean): string {
  const read = counterCorrect ? 'Counter read landed' : 'Counter read was shaky';
  return `${read}. ${battleSummary(result)} ${signal.rivalName} fought as a ${signal.intent} rival.`;
}

function nextHookFor(outcome: RivalOutcome, signal: RivalSignal): string {
  if (outcome === 'clear') return `${signal.rivalName} was tagged. Push the bounty into a tournament bracket.`;
  if (outcome === 'standoff') return `The signal held. Adjust the Counter Lane and rerun the duel.`;
  return `${signal.rivalName} escaped. Build a ${signal.counterAttribute} answer in Team Builder.`;
}

function rotateChoices(values: string[], answer: string, seed: number): string[] {
  const unique = [...new Set([answer, ...values])];
  const start = seededIndex(seed, unique.length);
  const rotated = Array.from({ length: unique.length }, (_, index) => unique[(start + index) % unique.length]);
  return rotated.includes(answer) ? rotated : [answer, ...rotated.filter((choice) => choice !== answer)];
}
