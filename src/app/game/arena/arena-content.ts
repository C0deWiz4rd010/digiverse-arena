export interface ArenaModeDefinition {
  id: string;
  name: string;
  field: string | null;
  teamSize: number;
  opponentIds: number[];
  reward: number;
  description: string;
  modifier: string;
  tier: 'calm' | 'danger' | 'elite' | 'volatile';
  hazard: string;
  cadence: 'fast' | 'standard' | 'endurance';
  nexusTags: string[];
}

export const ARENA_MODES: ArenaModeDefinition[] = [
  {
    id: 'solo-duel',
    name: 'Solo Duel',
    field: null,
    teamSize: 1,
    opponentIds: [1, 2, 3, 4],
    reward: 12,
    description: 'A clean one-on-one command battle for fast testing and daily warmups.',
    modifier: 'No field modifier.',
    tier: 'calm',
    hazard: 'Open signal, no terrain interference.',
    cadence: 'fast',
    nexusTags: ['tempo', 'starter', 'scan'],
  },
  {
    id: 'team-clash',
    name: 'Team Clash',
    field: null,
    teamSize: 3,
    opponentIds: [5, 6, 7, 8, 9, 10],
    reward: 24,
    description: 'Three-member team fight with coverage and target priority pressure.',
    modifier: 'Balanced AI focuses low-health targets.',
    tier: 'danger',
    hazard: 'Target locks punish weak backlines.',
    cadence: 'standard',
    nexusTags: ['coverage', 'focus', 'rotation'],
  },
  {
    id: 'field-hazard',
    name: 'Field Hazard',
    field: 'Dragon Roar',
    teamSize: 3,
    opponentIds: [11, 12, 13, 14, 15, 16],
    reward: 32,
    description: 'A volatile arena where Field affinity can swing damage.',
    modifier: 'Matching Field grants +10% action pressure.',
    tier: 'volatile',
    hazard: 'Field surges amplify matching Digimon.',
    cadence: 'standard',
    nexusTags: ['field', 'burst', 'counter'],
  },
  {
    id: 'boss-gate',
    name: 'Boss Gate',
    field: 'Nightmare Soldiers',
    teamSize: 3,
    opponentIds: [243, 244, 245],
    reward: 48,
    description: 'A dense PvE gate tuned around sustain, guard and finishing moves.',
    modifier: 'Enemy lineup starts with high-tier pressure.',
    tier: 'elite',
    hazard: 'Boss pressure tests Guardian Core.',
    cadence: 'endurance',
    nexusTags: ['guard', 'finisher', 'boss'],
  },
  {
    id: 'daily-trial',
    name: 'Daily Trial',
    field: 'Nature Spirits',
    teamSize: 2,
    opponentIds: [21, 34, 45, 62],
    reward: 28,
    description: 'A rotating-feeling local challenge seeded by the calendar day.',
    modifier: 'Rewards extra DigiCore Arena mastery.',
    tier: 'danger',
    hazard: 'Daily pulse shifts the safest opening.',
    cadence: 'fast',
    nexusTags: ['daily', 'tempo', 'reward'],
  },
  {
    id: 'nexus-rift',
    name: 'Nexus Rift',
    field: 'Deep Savers',
    teamSize: 3,
    opponentIds: [101, 102, 103, 104, 105, 106],
    reward: 56,
    description: 'A high-risk arena built around DigiLink protocols and unstable counter chains.',
    modifier: 'Nexus grade heavily affects reward forecast and fight tempo.',
    tier: 'volatile',
    hazard: 'Protocol drift rewards balanced teams and punishes static links.',
    cadence: 'endurance',
    nexusTags: ['nexus', 'contract', 'hype'],
  },
];

export function arenaMode(id: string): ArenaModeDefinition {
  return ARENA_MODES.find((mode) => mode.id === id) ?? ARENA_MODES[0];
}
