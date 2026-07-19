import type { Digimon, DigimonListItem } from '../../core/models/digimon';
import { dayIndex, seededIndex } from '../../core/utils/seed';
import type { MasteryTrack } from '../mastery/digicore-mastery';
import { dataCompleteness, deriveSkills, deriveStats, primaryAttribute, rarityScore, statTotal } from '../stats/battle-stats';

export type QuestObjectiveKind =
  | 'scan'
  | 'favorite'
  | 'team'
  | 'arena'
  | 'tournament'
  | 'field'
  | 'expedition'
  | 'forge'
  | 'squad-drill'
  | 'scouter-duel'
  | 'skill'
  | 'evolution'
  | 'minigame'
  | 'nexus'
  | 'rival';

export interface QuestObjective {
  kind: QuestObjectiveKind;
  target: string;
  required: number;
  progress: number;
  description: string;
}

export interface DigiCoreQuest {
  id: string;
  title: string;
  track: MasteryTrack;
  description: string;
  objectives: QuestObjective[];
  rewardBits: number;
  rewardMastery: number;
  status: 'active' | 'claimable' | 'claimed';
}

export interface CampaignState {
  id: 'local';
  dailySeed: number;
  activeQuestIds: string[];
  claimedQuestIds: string[];
  favoriteDigimonIds: number[];
  completedMiniGames: string[];
  completedSkillForgeIds: string[];
  completedSquadDrillIds: string[];
  completedScouterDuelIds: string[];
  rivalDigimonId: number;
  defeatedRivalIds: number[];
  exploredFieldNames: string[];
  updatedAt: number;
}

export interface CampaignFacts {
  scans: number;
  favorites: number;
  teams: number;
  battles: number;
  tournaments: number;
  notes: number;
  miniGames: number;
  rivals: number;
  expeditions: number;
  skillForges: number;
  squadDrills: number;
  scouterDuels: number;
  masteryTotal: number;
}

export interface DigimonIdea {
  digimonId: number;
  name: string;
  role: string;
  buildHint: string;
  teamHook: string;
  fieldHook: string;
  rivalHook: string;
  signatureMoment: string;
  score: number;
}

export interface EncounterDefinition {
  id: string;
  trigger: 'daily' | 'rival' | 'field' | 'skill' | 'arena' | 'glitch';
  headline: string;
  detail: string;
  actionLabel: string;
  route: string;
  rewardBits: number;
  risk: 'calm' | 'sharp' | 'volatile';
}

export interface MiniGameDefinition {
  id: string;
  title: string;
  verb: string;
  description: string;
  rewardBits: number;
  track: MasteryTrack;
}

export interface MiniGameChallenge {
  id: string;
  title: string;
  prompt: string;
  answer: string;
  choices: string[];
  hint: string;
  rewardBits: number;
  track: MasteryTrack;
}

export const MINI_GAMES: MiniGameDefinition[] = [
  {
    id: 'who-is-that',
    title: "Who's That Digimon?",
    verb: 'Guess',
    description: 'Pick the right Digimon from a DAPI image clue.',
    rewardBits: 18,
    track: 'scan',
  },
  {
    id: 'attribute-clash',
    title: 'Attribute Clash',
    verb: 'Counter',
    description: 'Choose the attribute lane that wins the matchup.',
    rewardBits: 20,
    track: 'tactics',
  },
  {
    id: 'field-scanner',
    title: 'Field Scanner',
    verb: 'Track',
    description: 'Follow Field hints and find the best expedition target.',
    rewardBits: 22,
    track: 'field',
  },
  {
    id: 'skill-match',
    title: 'Skill Match',
    verb: 'Read',
    description: 'Match a signature skill vibe to the correct combat role.',
    rewardBits: 16,
    track: 'skill',
  },
  {
    id: 'evolution-guess',
    title: 'Evolution Guess',
    verb: 'Predict',
    description: 'Read level and power clues to pick the evolution lead.',
    rewardBits: 24,
    track: 'evolution',
  },
];

export function defaultCampaignState(seed = dayIndex()): CampaignState {
  return {
    id: 'local',
    dailySeed: seed,
    activeQuestIds: dailyQuests(seed).map((quest) => quest.id),
    claimedQuestIds: [],
    favoriteDigimonIds: [],
    completedMiniGames: [],
    completedSkillForgeIds: [],
    completedSquadDrillIds: [],
    completedScouterDuelIds: [],
    rivalDigimonId: 1 + seededIndex(seed + 13, 1488),
    defeatedRivalIds: [],
    exploredFieldNames: [],
    updatedAt: Date.now(),
  };
}

export function dailyQuests(seed = dayIndex(), facts: Partial<CampaignFacts> = {}): DigiCoreQuest[] {
  const baseFacts = normalizeFacts(facts);
  const quests: DigiCoreQuest[] = [
    {
      id: `scan-${seed}`,
      title: 'Daily Scan Hunt',
      track: 'scan',
      description: 'Open profiles, inspect roles and push the DigiDex forward.',
      objectives: [objective('scan', 'profile', 3, baseFacts.scans, 'Scan 3 Digimon profiles.')],
      rewardBits: 24,
      rewardMastery: 7,
      status: 'active',
    },
    {
      id: `squad-${seed}`,
      title: 'Build a Team',
      track: 'tactics',
      description: 'Build or save a team that can take on a rival.',
      objectives: [objective('team', 'saved-team', 1, baseFacts.teams, 'Save or update 1 team.')],
      rewardBits: 34,
      rewardMastery: 8,
      status: 'active',
    },
    {
      id: `squad-drill-${seed}`,
      title: 'Team Drill',
      track: 'tactics',
      description: 'Run a team drill and save the training result.',
      objectives: [objective('squad-drill', 'training-run', 1, baseFacts.squadDrills, 'Complete 1 team drill.')],
      rewardBits: 40,
      rewardMastery: 9,
      status: 'active',
    },
    {
      id: `scouter-${seed}`,
      title: 'Compare Winner',
      track: 'tactics',
      description: 'Guess one winner on the Compare page.',
      objectives: [objective('scouter-duel', 'prediction', 1, baseFacts.scouterDuels, 'Make 1 Compare prediction.')],
      rewardBits: 36,
      rewardMastery: 8,
      status: 'active',
    },
    {
      id: `arena-${seed}`,
      title: 'Arena Battle',
      track: 'arena',
      description: 'Win a battle against the computer.',
      objectives: [objective('arena', 'battle', 1, baseFacts.battles, 'Finish 1 Arena or Quick Battle.')],
      rewardBits: 42,
      rewardMastery: 9,
      status: 'active',
    },
    {
      id: `rival-${seed}`,
      title: 'Beat a Rival',
      track: 'tactics',
      description: 'Scout the daily rival, guess the counter and win the battle.',
      objectives: [objective('rival', 'bounty', 1, baseFacts.rivals, 'Beat 1 rival.')],
      rewardBits: 46,
      rewardMastery: 10,
      status: 'active',
    },
    {
      id: `archive-${seed}`,
      title: 'Archive Bond',
      track: 'field',
      description: 'Mark favorites or write notes so the collection gains memory.',
      objectives: [
        objective('favorite', 'digimon', 1, baseFacts.favorites, 'Favorite 1 Digimon.'),
        objective('scan', 'note', 1, baseFacts.notes, 'Write 1 profile note.'),
      ],
      rewardBits: 28,
      rewardMastery: 6,
      status: 'active',
    },
    {
      id: `field-${seed}`,
      title: 'Expedition Route',
      track: 'field',
      description: 'Send your team on an expedition and record a discovery.',
      objectives: [objective('expedition', 'field-route', 1, baseFacts.expeditions, 'Complete or recover 1 Field Expedition.')],
      rewardBits: 38,
      rewardMastery: 9,
      status: 'active',
    },
    {
      id: `mini-${seed}`,
      title: 'Mini-Game',
      track: 'skill',
      description: 'Clear a quick mini-game for a small reward.',
      objectives: [objective('minigame', 'challenge', 1, baseFacts.miniGames, 'Clear 1 Mini-Game challenge.')],
      rewardBits: 30,
      rewardMastery: 7,
      status: 'active',
    },
    {
      id: `forge-${seed}`,
      title: 'Skill Training',
      track: 'skill',
      description: 'Run one skill training drill and save the combo.',
      objectives: [objective('forge', 'skill-chain', 1, baseFacts.skillForges, 'Complete 1 skill training drill.')],
      rewardBits: 36,
      rewardMastery: 9,
      status: 'active',
    },
  ];
  return quests.map((quest) => ({ ...quest, status: questStatus(quest) }));
}

export function campaignNextAction(quests: DigiCoreQuest[]): string {
  const active = quests.find((quest) => quest.status !== 'claimed');
  if (!active) return 'All daily goals are done. Try a tournament!';
  const objectiveText = active.objectives.find((objective) => objective.progress < objective.required)?.description;
  return objectiveText ?? `Claim ${active.title}.`;
}

export function questCompletion(quest: DigiCoreQuest): number {
  const total = quest.objectives.reduce((sum, objective) => sum + objective.required, 0);
  const progress = quest.objectives.reduce((sum, objective) => sum + Math.min(objective.required, objective.progress), 0);
  return Math.round((progress / Math.max(1, total)) * 100);
}

export function ideaForDigimon(digimon: Digimon): DigimonIdea {
  const stats = deriveStats(digimon);
  const total = statTotal(stats);
  const attribute = primaryAttribute(digimon);
  const fields = digimon.fields.map((field) => field.name);
  const mainField = fields[0] ?? 'Unknown Field';
  const skills = deriveSkills(digimon);
  const role = roleFromStats(stats, digimon.xAntibody);
  const signature = skills[0]?.name ?? `${digimon.name} Pulse`;
  return {
    digimonId: digimon.id,
    name: digimon.name,
    role,
    buildHint: `${role} build: lean into ${attribute} pressure, ${mainField} affinity and ${skills[0]?.tags[0] ?? 'tempo'} skills.`,
    teamHook: `Pair ${digimon.name} with a ${counterPartner(attribute)} partner and one Field ally for safer Nexus coverage.`,
    fieldHook: `${mainField} expedition target with ${Math.max(1, fields.length)} field signal${fields.length === 1 ? '' : 's'}.`,
    rivalHook: `Use as ${attribute} rival bait when the enemy bracket overcommits to ${counterTarget(attribute)}.`,
    signatureMoment: `${signature} becomes the highlight play when focus is banked before a close KO.`,
    score: Math.round(total / 10 + rarityScore(digimon) + dataCompleteness(digimon) / 3),
  };
}

export function ideasForTeam(team: Digimon[]): DigimonIdea[] {
  return team.map(ideaForDigimon).sort((a, b) => b.score - a.score);
}

export function dailyEncounters(seed = dayIndex()): EncounterDefinition[] {
  const encounters: EncounterDefinition[] = [
    {
      id: 'rival-call',
      trigger: 'rival',
      headline: 'Rival Call',
      detail: 'A rival signal is tracking your strongest recent team. Scout the counter lane and claim the bounty.',
      actionLabel: 'Open Rival Signal',
      route: '/rivals',
      rewardBits: 36,
      risk: 'sharp',
    },
    {
      id: 'field-storm',
      trigger: 'field',
      headline: 'Field Storm',
      detail: 'A Field route is unstable. Run Field Ops, recover discoveries and take a matching team into battle.',
      actionLabel: 'Open Field Ops',
      route: '/expeditions',
      rewardBits: 30,
      risk: 'calm',
    },
    {
      id: 'skill-bounty',
      trigger: 'skill',
      headline: 'Skill Bounty',
      detail: 'The Skill Library surfaced a finisher clue. Forge a combo chain and train the matching role.',
      actionLabel: 'Open Skill Forge',
      route: '/skill-forge',
      rewardBits: 26,
      risk: 'calm',
    },
    {
      id: 'glitch-gate',
      trigger: 'glitch',
      headline: 'Glitch Gate',
      detail: 'A volatile DAPI signal bends rewards. Clear a random battle for bonus mastery.',
      actionLabel: 'Enter chaos',
      route: '/random-battle',
      rewardBits: 44,
      risk: 'volatile',
    },
  ];
  const start = seededIndex(seed + 31, encounters.length);
  return [encounters[start], encounters[(start + 1) % encounters.length], encounters[(start + 2) % encounters.length]];
}

export function miniGameChallenge(kind: string, digimon: DigimonListItem[], seed = dayIndex()): MiniGameChallenge {
  const pool = digimon.length ? digimon : [{ id: 1, name: 'Agumon', image: null }];
  const target = pool[seededIndex(seed + kind.length, pool.length)];
  const choices = rotateChoices(pool.map((item) => item.name), target.name, seed);
  const definition = MINI_GAMES.find((game) => game.id === kind) ?? MINI_GAMES[0];
  if (definition.id === 'attribute-clash') {
    return {
      id: `${definition.id}-${seed}`,
      title: definition.title,
      prompt: 'Which lane beats Virus in the core triangle?',
      answer: 'Vaccine',
      choices: ['Data', 'Virus', 'Vaccine', 'Free'],
      hint: 'Vaccine > Virus > Data > Vaccine.',
      rewardBits: definition.rewardBits,
      track: definition.track,
    };
  }
  return {
    id: `${definition.id}-${target.id}-${seed}`,
    title: definition.title,
    prompt: challengePrompt(definition, target),
    answer: target.name,
    choices,
    hint: challengeHint(definition),
    rewardBits: definition.rewardBits,
    track: definition.track,
  };
}

function normalizeFacts(facts: Partial<CampaignFacts>): CampaignFacts {
  return {
    scans: facts.scans ?? 0,
    favorites: facts.favorites ?? 0,
    teams: facts.teams ?? 0,
    battles: facts.battles ?? 0,
    tournaments: facts.tournaments ?? 0,
    notes: facts.notes ?? 0,
    miniGames: facts.miniGames ?? 0,
    rivals: facts.rivals ?? 0,
    expeditions: facts.expeditions ?? 0,
    skillForges: facts.skillForges ?? 0,
    squadDrills: facts.squadDrills ?? 0,
    scouterDuels: facts.scouterDuels ?? 0,
    masteryTotal: facts.masteryTotal ?? 0,
  };
}

function objective(
  kind: QuestObjectiveKind,
  target: string,
  required: number,
  progress: number,
  description: string,
): QuestObjective {
  return { kind, target, required, progress: Math.min(required, progress), description };
}

function questStatus(quest: DigiCoreQuest): DigiCoreQuest['status'] {
  return quest.objectives.every((objective) => objective.progress >= objective.required) ? 'claimable' : 'active';
}

function roleFromStats(stats: ReturnType<typeof deriveStats>, xAntibody: boolean): string {
  if (xAntibody) return 'X-Overdrive Ace';
  if (stats.attack + stats.technique > stats.hp + stats.defense) return 'Burst Striker';
  if (stats.hp + stats.defense > stats.speed + stats.technique) return 'Guardian Anchor';
  if (stats.speed > stats.spirit) return 'Tempo Scout';
  return 'Spirit Tactician';
}

function counterPartner(attribute: string): string {
  if (attribute === 'Vaccine') return 'Data';
  if (attribute === 'Virus') return 'Vaccine';
  if (attribute === 'Data') return 'Virus';
  return 'Free';
}

function counterTarget(attribute: string): string {
  if (attribute === 'Vaccine') return 'Virus';
  if (attribute === 'Virus') return 'Data';
  if (attribute === 'Data') return 'Vaccine';
  return 'Unknown';
}

function rotateChoices(names: string[], answer: string, seed: number): string[] {
  const unique = [...new Set([answer, ...names])];
  while (unique.length < 4) unique.push(`Signal ${unique.length + 1}`);
  const start = seededIndex(seed + answer.length, unique.length);
  return Array.from({ length: Math.min(4, unique.length) }, (_, index) => unique[(start + index) % unique.length]).includes(answer)
    ? Array.from({ length: Math.min(4, unique.length) }, (_, index) => unique[(start + index) % unique.length])
    : [answer, ...unique.filter((name) => name !== answer).slice(0, 3)];
}

function challengePrompt(definition: MiniGameDefinition, target: DigimonListItem): string {
  if (definition.id === 'field-scanner') return `Field signal found. Which Digimon is tagged by this scan: ${target.name.slice(0, 3)}...?`;
  if (definition.id === 'skill-match') return `A skill echo points to ${target.name.length} glyphs. Pick the matching Digimon.`;
  if (definition.id === 'evolution-guess') return `Evolution route clue: ID ${target.id}. Which Digimon anchors the path?`;
  return 'Who is that Digimon?';
}

function challengeHint(definition: MiniGameDefinition): string {
  if (definition.id === 'field-scanner') return 'Use name fragments and Field intuition.';
  if (definition.id === 'skill-match') return 'Skill echoes favor signature names.';
  if (definition.id === 'evolution-guess') return 'Higher IDs often imply deeper archive paths.';
  return 'Use the image and silhouette memory.';
}
