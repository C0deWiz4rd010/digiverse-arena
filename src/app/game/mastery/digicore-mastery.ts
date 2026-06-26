export type MasteryTrack = 'arena' | 'evolution' | 'field' | 'scan' | 'skill' | 'tactics';

export interface DigiCoreProfile {
  tracks: Record<MasteryTrack, number>;
  unlocks: string[];
  badges: string[];
  updatedAt: number;
}

export interface MasteryEvent {
  track: MasteryTrack;
  amount: number;
  reason: string;
}

export interface MasteryUnlock {
  id: string;
  track: MasteryTrack;
  threshold: number;
  label: string;
}

export const MASTERY_UNLOCKS: MasteryUnlock[] = [
  { id: 'scan-scout', track: 'scan', threshold: 20, label: 'Scouter hints' },
  { id: 'field-cartographer', track: 'field', threshold: 35, label: 'Field route notes' },
  { id: 'skill-analyst', track: 'skill', threshold: 35, label: 'Skill tag insights' },
  { id: 'tactics-spark', track: 'tactics', threshold: 45, label: 'Team suggestion presets' },
  { id: 'arena-badge', track: 'arena', threshold: 60, label: 'Arena crest badge' },
  { id: 'evolution-echo', track: 'evolution', threshold: 60, label: 'Evolution echo frame' },
];

export function defaultDigiCoreProfile(): DigiCoreProfile {
  return {
    tracks: {
      arena: 0,
      evolution: 0,
      field: 0,
      scan: 0,
      skill: 0,
      tactics: 0,
    },
    unlocks: [],
    badges: [],
    updatedAt: Date.now(),
  };
}

export function applyMasteryEvent(profile: DigiCoreProfile, event: MasteryEvent): DigiCoreProfile {
  const tracks = { ...profile.tracks, [event.track]: Math.min(999, profile.tracks[event.track] + event.amount) };
  const unlocks = new Set(profile.unlocks);
  const badges = new Set(profile.badges);
  for (const unlock of MASTERY_UNLOCKS) {
    if (tracks[unlock.track] >= unlock.threshold) {
      unlocks.add(unlock.id);
      badges.add(unlock.label);
    }
  }
  return { tracks, unlocks: [...unlocks], badges: [...badges], updatedAt: Date.now() };
}

export function totalMastery(profile: DigiCoreProfile): number {
  return Object.values(profile.tracks).reduce((sum, value) => sum + value, 0);
}
