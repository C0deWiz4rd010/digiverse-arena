import { Injectable, computed, inject, signal } from '@angular/core';
import { digiDb } from '../cache/digi-db';
import { dayIndex } from '../utils/seed';
import { rankFromXp } from '../../game/progression/digirank';
import {
  ACHIEVEMENTS,
  evaluateAchievements,
  type AchievementDef,
} from '../../game/progression/achievements';
import type { CampaignFacts } from '../../game/campaign/campaign-content';
import { SettingsService } from '../settings/settings.service';
import type { ThemeId } from '../settings/settings.model';
import {
  defaultPlayerProfile,
  normalizePlayerProfile,
  type PlayerProfile,
} from './player.model';

const DB_KEY = 'local';
const LOGIN_BONUS_BASE = 8;

/**
 * Central tamer store: identity, bits wallet, XP/DigiRank, login streak and
 * achievement unlocks. Persists to Dexie and exposes reactive signals used
 * by the topbar, profile, shop and achievements views.
 */
@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly settings = inject(SettingsService);

  private readonly state = signal<PlayerProfile>(defaultPlayerProfile());
  private readonly unlockedIds = signal<ReadonlySet<string>>(new Set());
  private readonly ready = signal(false);

  readonly profile = this.state.asReadonly();
  readonly loaded = this.ready.asReadonly();
  readonly rank = computed(() => rankFromXp(this.state().xp));
  readonly bits = computed(() => this.state().bits);
  readonly streak = computed(() => this.state().streak);
  readonly onboarded = computed(() => this.state().onboarded);
  readonly unlockedAchievementIds = computed(() => this.unlockedIds());

  async init(): Promise<void> {
    if (this.ready()) return;
    await this.load();
    await this.registerDailyLogin();
    this.ready.set(true);
  }

  private async load(): Promise<void> {
    try {
      const record = await digiDb.profile.get(DB_KEY);
      if (record?.data) this.state.set(normalizePlayerProfile(record.data as Partial<PlayerProfile>));
      const unlocked = await digiDb.achievements.toArray();
      this.unlockedIds.set(new Set(unlocked.map((entry) => entry.id)));
    } catch {
      // First run / storage unavailable — keep defaults.
    }
  }

  private async persist(): Promise<void> {
    const next = { ...this.state(), updatedAt: Date.now() };
    this.state.set(next);
    await digiDb.profile.put({ id: DB_KEY, data: next, updatedAt: next.updatedAt }).catch(() => undefined);
  }

  /** Complete onboarding with the chosen identity. */
  async createProfile(input: {
    tamerName: string;
    partnerId: number | null;
    partnerName: string;
    theme: ThemeId;
  }): Promise<void> {
    const trimmed = input.tamerName.trim().slice(0, 20) || 'Tamer';
    this.state.update((profile) => ({
      ...profile,
      tamerName: trimmed,
      partnerId: input.partnerId,
      partnerName: input.partnerName,
      onboarded: true,
      unlockedThemes: [...new Set([...profile.unlockedThemes, input.theme])],
    }));
    this.settings.setTheme(input.theme);
    await this.persist();
  }

  /** Mark onboarding as done without creating a full identity (skip path). */
  async skipOnboarding(): Promise<void> {
    this.state.update((profile) => ({ ...profile, onboarded: true }));
    await this.persist();
  }

  async updateIdentity(input: Partial<Pick<PlayerProfile, 'tamerName' | 'partnerId' | 'partnerName' | 'title' | 'banner'>>): Promise<void> {
    this.state.update((profile) => ({
      ...profile,
      ...input,
      tamerName: input.tamerName?.trim().slice(0, 20) || profile.tamerName,
    }));
    await this.persist();
  }

  /** Award bits (and matching XP) from any game reward. */
  async addBits(amount: number, xp = amount): Promise<void> {
    if (amount <= 0 && xp <= 0) return;
    const gain = Math.max(0, Math.round(amount));
    this.state.update((profile) => ({
      ...profile,
      bits: profile.bits + gain,
      lifetimeBits: profile.lifetimeBits + gain,
      xp: profile.xp + Math.max(0, Math.round(xp)),
    }));
    await this.persist();
  }

  async addXp(amount: number): Promise<void> {
    if (amount <= 0) return;
    this.state.update((profile) => ({ ...profile, xp: profile.xp + Math.round(amount) }));
    await this.persist();
  }

  /** Attempt to spend bits. Returns false when the balance is insufficient. */
  async spendBits(amount: number): Promise<boolean> {
    if (amount <= 0) return true;
    if (this.state().bits < amount) return false;
    this.state.update((profile) => ({ ...profile, bits: profile.bits - Math.round(amount) }));
    await this.persist();
    return true;
  }

  async unlockTheme(theme: ThemeId): Promise<void> {
    this.state.update((profile) => ({
      ...profile,
      unlockedThemes: [...new Set([...profile.unlockedThemes, theme])],
    }));
    await this.persist();
  }

  isThemeUnlocked(theme: ThemeId): boolean {
    return this.state().unlockedThemes.includes(theme);
  }

  async unlockCosmetic(id: string): Promise<void> {
    this.state.update((profile) => ({
      ...profile,
      unlockedCosmetics: [...new Set([...profile.unlockedCosmetics, id])],
    }));
    await this.persist();
  }

  async equipTitle(title: string): Promise<void> {
    this.state.update((profile) => ({
      ...profile,
      title,
      unlockedTitles: [...new Set([...profile.unlockedTitles, title])],
    }));
    await this.persist();
  }

  /** Update the login streak once per day and grant a small login bonus. */
  private async registerDailyLogin(): Promise<void> {
    const today = dayIndex();
    const profile = this.state();
    if (profile.lastActiveDay === today) return;
    const continued = profile.lastActiveDay === today - 1;
    const streak = continued ? profile.streak + 1 : 1;
    const bonus = LOGIN_BONUS_BASE + Math.min(24, streak * 2);
    this.state.update((current) => ({
      ...current,
      streak,
      lastActiveDay: today,
      bits: current.bits + bonus,
      lifetimeBits: current.lifetimeBits + bonus,
      xp: current.xp + bonus,
    }));
    await this.persist();
  }

  /**
   * Re-evaluate achievements against the latest facts, grant rewards for anything
   * newly unlocked, and return the freshly unlocked definitions (for toasts).
   */
  async syncAchievements(facts: CampaignFacts): Promise<AchievementDef[]> {
    const rank = this.rank();
    const snapshot = {
      level: rank.level,
      streak: this.state().streak,
      lifetimeBits: this.state().lifetimeBits,
    };
    const progress = evaluateAchievements(facts, snapshot);
    const already = this.unlockedIds();
    const newlyUnlocked: AchievementDef[] = [];
    let bitReward = 0;
    for (const entry of progress) {
      if (entry.unlocked && !already.has(entry.def.id)) {
        newlyUnlocked.push(entry.def);
        bitReward += entry.def.rewardBits;
      }
    }
    if (newlyUnlocked.length === 0) return [];

    const now = Date.now();
    await digiDb.achievements
      .bulkPut(newlyUnlocked.map((def) => ({ id: def.id, unlockedAt: now })))
      .catch(() => undefined);
    this.unlockedIds.update((set) => {
      const next = new Set(set);
      for (const def of newlyUnlocked) next.add(def.id);
      return next;
    });
    // Grant bits + any awarded titles.
    this.state.update((profile) => {
      const titles = new Set(profile.unlockedTitles);
      for (const def of newlyUnlocked) if (def.rewardTitle) titles.add(def.rewardTitle);
      return {
        ...profile,
        bits: profile.bits + bitReward,
        lifetimeBits: profile.lifetimeBits + bitReward,
        unlockedTitles: [...titles],
      };
    });
    await this.persist();
    return newlyUnlocked;
  }

  totalAchievements(): number {
    return ACHIEVEMENTS.length;
  }

  /** Export the full save (profile + achievement unlocks) as a JSON string. */
  exportSave(): string {
    return JSON.stringify({
      profile: this.state(),
      achievements: [...this.unlockedIds()],
      version: 1,
    });
  }
}
