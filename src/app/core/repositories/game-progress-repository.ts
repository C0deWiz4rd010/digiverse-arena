import { Injectable } from '@angular/core';
import {
  digiDb,
  type BattleHistoryRecord,
  type SavedTeamRecord,
  type TournamentHistoryRecord,
} from '../cache/digi-db';
import {
  applyMasteryEvent,
  defaultDigiCoreProfile,
  type DigiCoreProfile,
  type MasteryEvent,
} from '../../game/mastery/digicore-mastery';

@Injectable({ providedIn: 'root' })
export class GameProgressRepository {
  async listTeams(): Promise<SavedTeamRecord[]> {
    return digiDb.teams.orderBy('updatedAt').reverse().toArray().catch(() => []);
  }

  async saveTeam(input: { id: string; name: string; memberIds: number[]; score: number }): Promise<void> {
    const existing = await digiDb.teams.get(input.id).catch(() => undefined);
    const now = Date.now();
    await digiDb.teams.put({
      ...input,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }

  async deleteTeam(id: string): Promise<void> {
    await digiDb.teams.delete(id);
  }

  async listBattles(limit = 12): Promise<BattleHistoryRecord[]> {
    return digiDb.battles.orderBy('createdAt').reverse().limit(limit).toArray().catch(() => []);
  }

  async saveBattle(record: Omit<BattleHistoryRecord, 'createdAt' | 'id'>): Promise<void> {
    await digiDb.battles.put({
      ...record,
      id: `battle-${Date.now()}-${Math.round(Math.random() * 9999)}`,
      createdAt: Date.now(),
    });
    await this.applyMastery({ track: 'arena', amount: record.winner === 'player' ? 9 : 4, reason: record.mode });
    await this.applyMastery({ track: 'tactics', amount: 3, reason: 'Battle analysis' });
  }

  async listTournaments(limit = 8): Promise<TournamentHistoryRecord[]> {
    return digiDb.tournaments.orderBy('updatedAt').reverse().limit(limit).toArray().catch(() => []);
  }

  async saveTournament(
    record: Omit<TournamentHistoryRecord, 'createdAt' | 'id' | 'updatedAt'>,
  ): Promise<void> {
    const now = Date.now();
    await digiDb.tournaments.put({
      ...record,
      id: `tournament-${now}-${Math.round(Math.random() * 9999)}`,
      createdAt: now,
      updatedAt: now,
    });
    await this.applyMastery({ track: 'arena', amount: 14, reason: record.name });
    await this.applyMastery({ track: 'tactics', amount: 8, reason: 'Bracket planning' });
  }

  async mastery(): Promise<DigiCoreProfile> {
    const stored = await digiDb.mastery.get('local').catch(() => undefined);
    if (stored?.data) return stored.data as DigiCoreProfile;
    const profile = defaultDigiCoreProfile();
    await digiDb.mastery.put({ id: 'local', data: profile, updatedAt: profile.updatedAt });
    return profile;
  }

  async applyMastery(event: MasteryEvent): Promise<DigiCoreProfile> {
    const next = applyMasteryEvent(await this.mastery(), event);
    await digiDb.mastery.put({ id: 'local', data: next, updatedAt: next.updatedAt });
    return next;
  }

  async clearUserData(): Promise<void> {
    await Promise.all([
      digiDb.teams.clear(),
      digiDb.battles.clear(),
      digiDb.tournaments.clear(),
      digiDb.mastery.clear(),
      digiDb.settings.clear(),
    ]);
  }
}
