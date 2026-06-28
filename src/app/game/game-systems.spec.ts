import { describe, expect, it } from 'vitest';
import type { Digimon } from '../core/models/digimon';
import {
  analyzeDigiLink,
  applyMasteryEvent,
  attributeMultiplier,
  combatTuningFromProfile,
  dailyQuests,
  defaultCampaignState,
  defaultDigiCoreProfile,
  deriveStats,
  createFieldExpeditions,
  createSkillForgePrograms,
  expeditionTeamFit,
  expeditionWinRate,
  generateNexusContracts,
  ideaForDigimon,
  levelTier,
  miniGameChallenge,
  questCompletion,
  createRivalSignal,
  rivalScoreLine,
  rivalWinRate,
  runRivalDuel,
  runFieldExpedition,
  runTournament,
  runSkillForge,
  scoreTeam,
  skillComboFit,
  skillForgeWinRate,
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

describe('campaign, ideas and mini-games', () => {
  it('builds daily quests from local progress facts', () => {
    const quests = dailyQuests(42, {
      scans: 3,
      favorites: 1,
      teams: 1,
      battles: 1,
      tournaments: 0,
      notes: 1,
      miniGames: 1,
      rivals: 1,
      expeditions: 1,
      skillForges: 1,
      masteryTotal: 40,
    });
    expect(quests.every((quest) => quest.status === 'claimable')).toBe(true);
    expect(questCompletion(quests[0])).toBe(100);
    expect(defaultCampaignState(42).activeQuestIds.length).toBeGreaterThan(0);
  });

  it('creates a playable idea card from a Digimon profile', () => {
    const idea = ideaForDigimon(greymon);
    expect(idea.name).toBe('Greymon');
    expect(idea.buildHint).toContain('Vaccine');
    expect(idea.signatureMoment).toContain('Mega Flame');
    expect(idea.score).toBeGreaterThan(0);
  });

  it('generates deterministic mini-game challenges with valid answers', () => {
    const pool = [
      { id: 1, name: 'Agumon', image: null },
      { id: 2, name: 'Gabumon', image: null },
      { id: 3, name: 'Devimon', image: null },
      { id: 4, name: 'Greymon', image: null },
    ];
    const challenge = miniGameChallenge('who-is-that', pool, 9);
    expect(challenge.choices).toContain(challenge.answer);
    expect(challenge.rewardBits).toBeGreaterThan(0);
    expect(miniGameChallenge('attribute-clash', pool, 9).answer).toBe('Vaccine');
  });
});

describe('rival signal system', () => {
  it('creates a deterministic rival signal with a valid counter lane', () => {
    const signal = createRivalSignal(devimon, 77);
    expect(signal.rivalName).toBe('Devimon');
    expect(signal.counterAttribute).toBe('Vaccine');
    expect(signal.scoutChoices).toContain(signal.scoutAnswer);
    expect(signal.phases).toHaveLength(3);
    expect(rivalScoreLine(signal)).toContain('threat');
  });

  it('runs and scores a rival duel', () => {
    const signal = createRivalSignal(devimon, 88);
    const duel = runRivalDuel(signal, [agumon, gabumon, greymon], [devimon, greymon], signal.counterAttribute);
    expect(['clear', 'escaped', 'standoff']).toContain(duel.outcome);
    expect(duel.counterCorrect).toBe(true);
    expect(duel.result.events.at(-1)?.type).toBe('battle-end');
    expect(duel.rewardBits).toBeGreaterThan(0);
    expect(rivalWinRate([{ outcome: 'clear' }, { outcome: 'escaped' }])).toBe(50);
  });
});

describe('field expedition system', () => {
  it('creates field missions from DAPI field metadata', () => {
    const missions = createFieldExpeditions(
      [
        { id: 1, name: 'Dragon Roar' },
        { id: 2, name: 'Nightmare Soldiers' },
        { id: 3, name: 'Nature Spirits' },
      ],
      12,
    );
    expect(missions.length).toBeGreaterThanOrEqual(3);
    expect(missions[0].rewardBits).toBeGreaterThan(0);
    expect(missions[0].tags).toContain(missions[0].fieldName);
  });

  it('scores and resolves expeditions with discoveries', () => {
    const mission = createFieldExpeditions([{ id: 1, name: 'Dragon Roar' }], 4)[0];
    const fit = expeditionTeamFit(mission, [agumon, gabumon, greymon]);
    const result = runFieldExpedition(mission, [agumon, gabumon, greymon], 44);
    expect(fit.total).toBeGreaterThan(0);
    expect(['complete', 'partial', 'lost']).toContain(result.outcome);
    expect(result.discoveries.length).toBeGreaterThan(0);
    expect(result.rewardBits).toBeGreaterThan(0);
    expect(expeditionWinRate([{ outcome: 'complete' }, { outcome: 'partial' }])).toBe(50);
  });
});

describe('skill forge system', () => {
  it('creates skill forge programs from DAPI skill metadata', () => {
    const programs = createSkillForgePrograms(
      [
        { id: 1, name: 'Baby Flame' },
        { id: 2, name: 'Death Claw' },
        { id: 3, name: 'Mega Flame' },
      ],
      22,
    );
    expect(programs).toHaveLength(6);
    expect(programs[0].rewardBits).toBeGreaterThan(0);
    expect(programs[0].tags).toContain(programs[0].targetTag);
  });

  it('scores and resolves skill forge drills with combo chains', () => {
    const program = createSkillForgePrograms([{ id: 1, name: 'Baby Flame' }], 5)[0];
    const fit = skillComboFit(program, [agumon, gabumon, greymon]);
    const result = runSkillForge(program, [agumon, gabumon, greymon], 55);
    expect(fit.total).toBeGreaterThan(0);
    expect(['perfect', 'stable', 'fizzle']).toContain(result.outcome);
    expect(result.comboChain.length).toBeGreaterThan(0);
    expect(result.rewardBits).toBeGreaterThan(0);
    expect(skillForgeWinRate([{ outcome: 'perfect' }, { outcome: 'fizzle' }])).toBe(50);
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
