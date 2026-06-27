import { describe, expect, it } from 'vitest';
import type { Digimon } from '../core/models/digimon';
import {
  analyzeDigiLink,
  applyMasteryEvent,
  attributeMultiplier,
  combatTuningFromProfile,
  defaultDigiCoreProfile,
  deriveStats,
  generateNexusContracts,
  levelTier,
  runTournament,
  scoreTeam,
  simulateBattle,
  statTotal,
} from '.';

const agumon = makeDigimon(1, 'Agumon', 'Child', 'Vaccine', 'Dragon Roar', [
  'Baby Flame',
  'Claw Attack',
]);
const gabumon = makeDigimon(2, 'Gabumon', 'Child', 'Data', 'Nature Spirits', [
  'Petit Fire',
  'Horn Strike',
]);
const devimon = makeDigimon(3, 'Devimon', 'Adult', 'Virus', 'Nightmare Soldiers', [
  'Death Claw',
  'Dark Wing',
]);
const greymon = makeDigimon(4, 'Greymon', 'Adult', 'Vaccine', 'Dragon Roar', [
  'Mega Flame',
  'Great Horn',
]);

describe('battle stat derivation', () => {
  it('maps Japanese and English level names to stable tiers', () => {
    expect(levelTier(agumon)).toBe(2);
    expect(levelTier(devimon)).toBe(3);
    expect(levelTier(makeDigimon(9, 'Mystery', 'Rookie', 'Free', 'Unknown', []))).toBe(2);
  });

  it('derives deterministic stats from the same Digimon input', () => {
    expect(deriveStats(agumon)).toEqual(deriveStats(agumon));
    expect(statTotal(deriveStats(greymon))).toBeGreaterThan(statTotal(deriveStats(agumon)));
  });

  it('applies the core attribute triangle', () => {
    expect(attributeMultiplier('Vaccine', 'Virus')).toBe(1.25);
    expect(attributeMultiplier('Virus', 'Data')).toBe(1.25);
    expect(attributeMultiplier('Data', 'Vaccine')).toBe(1.25);
    expect(attributeMultiplier('Virus', 'Vaccine')).toBe(0.8);
  });
});

describe('team and battle systems', () => {
  it('scores stronger and more cohesive teams above empty teams', () => {
    expect(scoreTeam([]).total).toBe(0);
    expect(scoreTeam([agumon, gabumon, greymon]).total).toBeGreaterThan(50);
  });

  it('terminates a deterministic battle with a replayable event log', () => {
    const playerNexus = combatTuningFromProfile(analyzeDigiLink([agumon, gabumon]));
    const first = simulateBattle([agumon, gabumon], [devimon, greymon], {
      mode: 'spec',
      arenaField: 'Dragon Roar',
      seed: 123,
      playerNexus,
    });
    const second = simulateBattle([agumon, gabumon], [devimon, greymon], {
      mode: 'spec',
      arenaField: 'Dragon Roar',
      seed: 123,
    });
    expect(first.winner).toBe(second.winner);
    expect(first.events.some((event) => event.type === 'nexus-pulse')).toBe(true);
    expect(first.events.at(-1)?.type).toBe('battle-end');
    expect(first.turns).toBeLessThanOrEqual(72);
  });

  it('creates DigiLink Nexus contracts from team chemistry', () => {
    const profile = analyzeDigiLink([agumon, gabumon, greymon]);
    const contracts = generateNexusContracts(profile);
    expect(profile.score).toBeGreaterThan(0);
    expect(profile.perks.damageModifier).toBeGreaterThanOrEqual(1);
    expect(contracts).toHaveLength(3);
  });
});

describe('tournaments and mastery', () => {
  it('runs a complete tournament and records a champion', () => {
    const run = runTournament(
      {
        id: 'spec-cup',
        name: 'Spec Cup',
        tagline: 'Spec drama.',
        format: 'single-elimination',
        size: 4,
        teamSize: 1,
        field: null,
        seedIds: [1, 2, 3, 4],
        description: '',
        rule: '',
        reward: '',
        difficulty: 2,
        modifiers: ['Spec modifier'],
        sponsor: 'Spec League',
      },
      [agumon],
      [gabumon, devimon, greymon],
    );
    expect(run.status).toBe('complete');
    expect(run.championName).toBeTruthy();
    expect(run.matches.length).toBe(3);
    expect(run.hypeScore).toBeGreaterThan(0);
    expect(run.storyBeats.length).toBeGreaterThanOrEqual(2);
    expect(run.rewardSummary).toContain('bits');
  });

  it('adds strategy, phases, moments and reward draft data to tournament runs', () => {
    const run = runTournament(
      {
        id: 'overdrive-cup',
        name: 'Overdrive Cup',
        tagline: 'Spec spectacle.',
        format: 'boss-rush',
        size: 4,
        teamSize: 1,
        field: 'Dragon Roar',
        seedIds: [1, 2, 3, 4],
        description: '',
        rule: '',
        reward: 'Spec Crown',
        difficulty: 4,
        modifiers: ['Spec modifier'],
        sponsor: 'Spec League',
      },
      [agumon],
      [gabumon, devimon, greymon],
      'overdrive',
    );
    expect(run.strategy.id).toBe('overdrive');
    expect(run.phases.length).toBeGreaterThan(0);
    expect(run.moments.some((moment) => moment.kind === 'glitch')).toBe(true);
    expect(run.rewardOptions).toHaveLength(3);
    expect(run.matches.some((match) => match.dramaTags.length > 0)).toBe(true);
  });

  it('unlocks DigiCore badges at thresholds', () => {
    const profile = applyMasteryEvent(defaultDigiCoreProfile(), {
      track: 'arena',
      amount: 60,
      reason: 'spec',
    });
    expect(profile.unlocks).toContain('arena-badge');
    expect(profile.badges).toContain('Arena crest badge');
  });
});

function makeDigimon(
  id: number,
  name: string,
  level: string,
  attribute: string,
  field: string,
  skills: string[],
): Digimon {
  return {
    id,
    name,
    xAntibody: false,
    image: `https://example.test/${name}.png`,
    images: [{ href: `https://example.test/${name}.png`, transparent: true }],
    levels: [{ id: 1, name: level }],
    types: [{ id: 1, name: 'Reptile' }],
    attributes: [{ id: 1, name: attribute }],
    fields: [{ id: 1, name: field, image: null }],
    releaseDate: null,
    descriptions: [{ origin: 'spec', language: 'en_us', text: `${name} profile.` }],
    skills: skills.map((skill, index) => ({
      id: id * 100 + index,
      name: skill,
      translation: '',
      description: `${skill} test description.`,
    })),
    priorEvolutions: [],
    nextEvolutions: [],
  };
}
