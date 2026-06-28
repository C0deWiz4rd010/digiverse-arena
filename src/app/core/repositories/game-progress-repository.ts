import { Injectable } from '@angular/core';
import {
  digiDb,
  type BattleHistoryRecord,
  type CampaignRecord,
  type DigimonNoteRecord,
  type ExpeditionRunRecord,
  type FavoriteRecord,
  type MiniGameRunRecord,
  type RivalRunRecord,
  type SavedTeamRecord,
  type TournamentHistoryRecord,
} from '../cache/digi-db';
import type { DigiCoreQuest, CampaignFacts, CampaignState } from '../../game/campaign/campaign-content';
import { dailyQuests, defaultCampaignState } from '../../game/campaign/campaign-content';
import type { FieldExpeditionResult } from '../../game/field/field-expedition';
import type { RivalDuelResult } from '../../game/rivals/rival-system';
import {
  applyMasteryEvent,
  defaultDigiCoreProfile,
  totalMastery,
  type DigiCoreProfile,
  type MasteryEvent,
} from '../../game/mastery/digicore-mastery';
import { dayIndex } from '../utils/seed';

@Injectable({ providedIn: 'root' })
export class GameProgressRepository {
  async listFavorites(): Promise<FavoriteRecord[]> {
    return digiDb.favorites.orderBy('createdAt').reverse().toArray().catch(() => []);
  }

  async isFavorite(id: number): Promise<boolean> {
    return Boolean(await digiDb.favorites.get(id).catch(() => undefined));
  }

  async toggleFavorite(input: { id: number; name: string; image: string | null }): Promise<boolean> {
    const existing = await digiDb.favorites.get(input.id).catch(() => undefined);
    if (existing) {
      await digiDb.favorites.delete(input.id);
      const state = await this.campaignState();
      await this.saveCampaignState({
        ...state,
        favoriteDigimonIds: state.favoriteDigimonIds.filter((id) => id !== input.id),
      });
      return false;
    }
    await digiDb.favorites.put({ ...input, createdAt: Date.now() });
    const state = await this.campaignState();
    await this.saveCampaignState({
      ...state,
      favoriteDigimonIds: [...new Set([...state.favoriteDigimonIds, input.id])],
    });
    await this.applyMastery({ track: 'scan', amount: 3, reason: `Favorite ${input.name}` });
    return true;
  }

  async listNotes(): Promise<DigimonNoteRecord[]> {
    return digiDb.notes.orderBy('updatedAt').reverse().toArray().catch(() => []);
  }

  async getNote(digimonId: number): Promise<string> {
    return (await digiDb.notes.get(digimonId).catch(() => undefined))?.text ?? '';
  }

  async saveNote(digimonId: number, text: string): Promise<void> {
    const trimmed = text.trim();
    const existing = await digiDb.notes.get(digimonId).catch(() => undefined);
    if (!trimmed) {
      await digiDb.notes.delete(digimonId);
      return;
    }
    const now = Date.now();
    await digiDb.notes.put({
      digimonId,
      text: trimmed.slice(0, 800),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
    await this.applyMastery({ track: 'scan', amount: 4, reason: `Profile note ${digimonId}` });
  }

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
    await this.applyMastery({ track: 'tactics', amount: 8, reason: input.name });
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

  async campaignState(): Promise<CampaignState> {
    const stored = await digiDb.campaign.get('local').catch(() => undefined);
    const today = dayIndex();
    if (stored?.data) {
      const state = stored.data as CampaignState;
      const normalizedState: CampaignState = {
        ...state,
        favoriteDigimonIds: state.favoriteDigimonIds ?? [],
        completedMiniGames: state.completedMiniGames ?? [],
        defeatedRivalIds: state.defeatedRivalIds ?? [],
        exploredFieldNames: state.exploredFieldNames ?? [],
      };
      if (normalizedState.dailySeed === today) return normalizedState;
      const next = {
        ...defaultCampaignState(today),
        favoriteDigimonIds: normalizedState.favoriteDigimonIds,
        completedMiniGames: normalizedState.completedMiniGames,
        defeatedRivalIds: normalizedState.defeatedRivalIds,
        exploredFieldNames: normalizedState.exploredFieldNames,
      };
      await this.saveCampaignState(next);
      return next;
    }
    const state = defaultCampaignState(today);
    await this.saveCampaignState(state);
    return state;
  }

  async saveCampaignState(state: CampaignState): Promise<void> {
    const record: CampaignRecord = { id: 'local', data: { ...state, updatedAt: Date.now() }, updatedAt: Date.now() };
    await digiDb.campaign.put(record);
  }

  async campaignFacts(): Promise<CampaignFacts> {
    const [scans, favorites, teams, battles, tournaments, notes, miniGameRuns, rivalRuns, expeditionRuns, mastery] = await Promise.all([
      digiDb.digimon.count().catch(() => 0),
      digiDb.favorites.count().catch(() => 0),
      digiDb.teams.count().catch(() => 0),
      digiDb.battles.count().catch(() => 0),
      digiDb.tournaments.count().catch(() => 0),
      digiDb.notes.count().catch(() => 0),
      digiDb.miniGameRuns.toArray().catch(() => [] as MiniGameRunRecord[]),
      digiDb.rivalRuns.toArray().catch(() => [] as RivalRunRecord[]),
      digiDb.expeditionRuns.toArray().catch(() => [] as ExpeditionRunRecord[]),
      this.mastery(),
    ]);
    return {
      scans,
      favorites,
      teams,
      battles,
      tournaments,
      notes,
      miniGames: miniGameRuns.filter((run) => run.result === 'win').length,
      rivals: rivalRuns.filter((run) => run.outcome === 'clear').length,
      expeditions: expeditionRuns.filter((run) => run.outcome === 'complete' || run.outcome === 'partial').length,
      masteryTotal: totalMastery(mastery),
    };
  }

  async dailyQuestBoard(): Promise<DigiCoreQuest[]> {
    const [state, facts] = await Promise.all([this.campaignState(), this.campaignFacts()]);
    return dailyQuests(state.dailySeed, facts).map((quest) => ({
      ...quest,
      status: state.claimedQuestIds.includes(quest.id) ? 'claimed' : quest.status,
    }));
  }

  async claimQuest(quest: DigiCoreQuest): Promise<boolean> {
    const state = await this.campaignState();
    if (quest.status !== 'claimable' || state.claimedQuestIds.includes(quest.id)) return false;
    const claimedQuestIds = [...state.claimedQuestIds, quest.id];
    await this.saveCampaignState({ ...state, claimedQuestIds });
    await this.applyMastery({ track: quest.track, amount: quest.rewardMastery, reason: quest.title });
    return true;
  }

  async listMiniGameRuns(limit = 12): Promise<MiniGameRunRecord[]> {
    return digiDb.miniGameRuns.orderBy('createdAt').reverse().limit(limit).toArray().catch(() => []);
  }

  async listRivalRuns(limit = 12): Promise<RivalRunRecord[]> {
    return digiDb.rivalRuns.orderBy('createdAt').reverse().limit(limit).toArray().catch(() => []);
  }

  async listExpeditionRuns(limit = 12): Promise<ExpeditionRunRecord[]> {
    return digiDb.expeditionRuns.orderBy('createdAt').reverse().limit(limit).toArray().catch(() => []);
  }

  async saveExpeditionRun(result: FieldExpeditionResult): Promise<void> {
    await digiDb.expeditionRuns.put({
      id: `expedition-${Date.now()}-${Math.round(Math.random() * 9999)}`,
      expeditionId: result.expedition.id,
      fieldName: result.expedition.fieldName,
      outcome: result.outcome,
      score: result.score,
      rewardBits: result.rewardBits,
      discoveries: result.discoveries,
      recap: result.recap,
      createdAt: Date.now(),
    });
    if (result.outcome === 'complete' || result.outcome === 'partial') {
      const state = await this.campaignState();
      await this.saveCampaignState({
        ...state,
        exploredFieldNames: [...new Set([...(state.exploredFieldNames ?? []), result.expedition.fieldName])],
      });
    }
    await this.applyMastery({
      track: result.masteryTrack,
      amount: result.masteryAmount,
      reason: `Field Expedition ${result.expedition.fieldName}`,
    });
  }

  async saveRivalRun(result: RivalDuelResult): Promise<void> {
    await digiDb.rivalRuns.put({
      id: `rival-${Date.now()}-${Math.round(Math.random() * 9999)}`,
      rivalId: result.signal.rivalId,
      rivalName: result.signal.rivalName,
      outcome: result.outcome,
      counterAttribute: result.counterAttribute,
      rewardBits: result.rewardBits,
      recap: result.recap,
      createdAt: Date.now(),
    });
    if (result.outcome === 'clear') {
      const state = await this.campaignState();
      await this.saveCampaignState({
        ...state,
        defeatedRivalIds: [...new Set([...(state.defeatedRivalIds ?? []), result.signal.rivalId])],
      });
    }
    await this.applyMastery({
      track: result.masteryTrack,
      amount: result.masteryAmount,
      reason: `Rival Signal ${result.signal.rivalName}`,
    });
  }

  async recordMiniGame(
    gameId: string,
    result: MiniGameRunRecord['result'],
    rewardBits: number,
    track: MasteryEvent['track'] = 'skill',
  ): Promise<void> {
    await digiDb.miniGameRuns.put({
      id: `mini-${Date.now()}-${Math.round(Math.random() * 9999)}`,
      gameId,
      result,
      rewardBits,
      createdAt: Date.now(),
    });
    if (result === 'win') {
      const state = await this.campaignState();
      await this.saveCampaignState({
        ...state,
        completedMiniGames: [...new Set([...state.completedMiniGames, gameId])],
      });
    }
    await this.applyMastery({
      track,
      amount: result === 'win' ? 7 : 2,
      reason: result === 'win' ? `Mini-Game ${gameId}` : `Mini-Game practice ${gameId}`,
    });
  }

  async clearUserData(): Promise<void> {
    await Promise.all([
      digiDb.teams.clear(),
      digiDb.battles.clear(),
      digiDb.tournaments.clear(),
      digiDb.mastery.clear(),
      digiDb.settings.clear(),
      digiDb.favorites.clear(),
      digiDb.notes.clear(),
      digiDb.campaign.clear(),
      digiDb.miniGameRuns.clear(),
      digiDb.rivalRuns.clear(),
      digiDb.expeditionRuns.clear(),
    ]);
  }
}
