import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DigimonRepository } from '../../core/repositories/digimon-repository';
import { GameProgressRepository } from '../../core/repositories/game-progress-repository';
import { PlayerService } from '../../core/player/player.service';
import { TamerAvatar } from '../../design-system/components/tamer-avatar';
import { DigiStatBar } from '../../design-system/components/digi-stat-bar';
import { DigiCard } from '../../design-system/components/digi-card';
import {
  ACHIEVEMENTS,
  evaluateAchievements,
  type AchievementProgress,
} from '../../game/progression/achievements';
import type { CampaignFacts } from '../../game/campaign/campaign-content';
import type { MasteryTrack } from '../../game/mastery/digicore-mastery';

const FALLBACK_IMAGE = 'assets/placeholders/digimon-fallback.svg';

const MASTERY_LABELS: Record<MasteryTrack, string> = {
  arena: 'Arena',
  evolution: 'Evolution',
  field: 'Field',
  scan: 'Scan',
  skill: 'Skill',
  tactics: 'Tactics',
};

@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TamerAvatar, DigiStatBar, DigiCard],
  template: `
    <section class="profile">
      <header class="profile__intro">
        <p class="profile__eyebrow">DigiTamer HQ</p>
        <h1 class="profile__title">Your Profile</h1>
      </header>

      <!-- Identity hero -->
      <digi-card [glow]="true" class="profile__hero">
        <div class="profile__id">
          <digi-tamer-avatar [seed]="profile().avatarSeed" [name]="profile().tamerName" [size]="72" />
          <div class="profile__idText">
            <h2 class="profile__name">{{ profile().tamerName }}</h2>
            <p class="profile__rank">
              <span class="profile__lvl">Lv {{ rank().level }}</span>
              {{ rank().title }}
            </p>
          </div>
          @if (profile().partnerId !== null) {
            <div class="profile__partner">
              <img [src]="partnerImage()" [alt]="profile().partnerName" (error)="imgError($event)" />
              <span>{{ profile().partnerName || 'Partner' }}</span>
            </div>
          }
        </div>
        <div class="profile__xp">
          <digi-stat-bar
            label="DigiRank XP"
            [value]="rank().xpIntoLevel"
            [max]="rank().xpForLevel"
          />
          <p class="profile__xpNote">
            {{ rank().xpIntoLevel }} / {{ rank().xpForLevel }} XP to Lv {{ rank().level + 1 }}
          </p>
        </div>
      </digi-card>

      <!-- Wallet + streak metrics -->
      <div class="profile__metrics">
        <div class="profile__metric">
          <span class="profile__metricIcon" aria-hidden="true">💠</span>
          <span class="profile__metricVal">{{ profile().bits }}</span>
          <span class="profile__metricLbl">Bits</span>
        </div>
        <div class="profile__metric">
          <span class="profile__metricIcon" aria-hidden="true">📈</span>
          <span class="profile__metricVal">{{ profile().lifetimeBits }}</span>
          <span class="profile__metricLbl">Lifetime</span>
        </div>
        <div class="profile__metric">
          <span class="profile__metricIcon" aria-hidden="true">🔥</span>
          <span class="profile__metricVal">{{ profile().streak }}</span>
          <span class="profile__metricLbl">Day streak</span>
        </div>
        <div class="profile__metric">
          <span class="profile__metricIcon" aria-hidden="true">🏅</span>
          <span class="profile__metricVal">{{ unlockedCount() }}/{{ totalAchievements }}</span>
          <span class="profile__metricLbl">Achievements</span>
        </div>
      </div>

      <!-- Quick actions -->
      <nav class="profile__actions" aria-label="Profile shortcuts">
        <a routerLink="/achievements" class="profile__action">🏅 Achievements</a>
        <a routerLink="/shop" class="profile__action">🛒 Shop</a>
        <a routerLink="/collection" class="profile__action">📁 Collection</a>
        <a routerLink="/settings" class="profile__action">⚙️ Settings</a>
      </nav>

      <!-- Mastery breakdown -->
      <digi-card class="profile__section">
        <h3 class="profile__h3">Mastery Cores</h3>
        <div class="profile__mastery">
          @for (track of masteryRows(); track track.id) {
            <digi-stat-bar [label]="track.label" [value]="track.value" [max]="masteryMax()" />
          }
        </div>
      </digi-card>

      <!-- Achievement showcase -->
      <digi-card class="profile__section">
        <div class="profile__sectionHead">
          <h3 class="profile__h3">Recent unlocks</h3>
          <a routerLink="/achievements" class="profile__link">View all →</a>
        </div>
        @if (showcase().length) {
          <div class="profile__badges">
            @for (item of showcase(); track item.def.id) {
              <div class="profile__badge" [title]="item.def.title">
                <span class="profile__badgeIcon" aria-hidden="true">{{ item.def.icon }}</span>
                <span class="profile__badgeName">{{ item.def.title }}</span>
              </div>
            }
          </div>
        } @else {
          <p class="profile__muted">No achievements yet — play a mode to earn your first badge.</p>
        }
      </digi-card>
    </section>
  `,
  styles: `
    .profile {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
    .profile__intro {
      margin-bottom: var(--space-1);
    }
    .profile__eyebrow {
      margin: 0 0 var(--space-1);
      font-family: var(--font-mono);
      font-size: var(--text-2xs);
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--color-primary-400);
    }
    .profile__title {
      margin: 0;
      font-size: var(--text-2xl);
    }
    .profile__id {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-wrap: wrap;
    }
    .profile__idText {
      min-width: 0;
    }
    .profile__name {
      margin: 0;
      font-size: var(--text-lg);
      word-break: break-word;
    }
    .profile__rank {
      margin: var(--space-1) 0 0;
      color: var(--text-muted);
      font-size: var(--text-sm);
    }
    .profile__lvl {
      display: inline-block;
      margin-right: var(--space-2);
      padding: 1px var(--space-2);
      border-radius: var(--radius-pill);
      background: color-mix(in srgb, var(--color-primary-500) 18%, transparent);
      color: var(--color-primary-400);
      font-family: var(--font-mono);
      font-size: var(--text-2xs);
      font-weight: 700;
    }
    .profile__partner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      margin-left: auto;
      font-size: var(--text-2xs);
      color: var(--text-muted);
    }
    .profile__partner img {
      width: 46px;
      height: 46px;
      object-fit: contain;
      border-radius: var(--radius-md);
      background: var(--color-surface-glass);
    }
    .profile__xp {
      margin-top: var(--space-4);
    }
    .profile__xpNote {
      margin: var(--space-2) 0 0;
      font-family: var(--font-mono);
      font-size: var(--text-2xs);
      color: var(--text-soft);
    }
    .profile__metrics {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-2);
    }
    .profile__metric {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: var(--space-3);
      background: var(--color-surface-800);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-md);
    }
    .profile__metricIcon {
      font-size: 1.2rem;
    }
    .profile__metricVal {
      font-family: var(--font-mono);
      font-size: var(--text-lg);
      color: var(--text-main);
    }
    .profile__metricLbl {
      font-size: var(--text-2xs);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-soft);
    }
    .profile__actions {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-2);
    }
    .profile__action {
      padding: var(--space-3);
      text-align: center;
      background: var(--color-surface-glass);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-md);
      color: var(--text-main);
      font-size: var(--text-sm);
    }
    .profile__action:active {
      transform: scale(0.98);
    }
    .profile__section {
      display: block;
    }
    .profile__sectionHead {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: var(--space-2);
    }
    .profile__h3 {
      margin: 0 0 var(--space-3);
      font-size: var(--text-base);
    }
    .profile__link {
      font-size: var(--text-xs);
      white-space: nowrap;
    }
    .profile__mastery {
      display: grid;
      gap: var(--space-3);
    }
    .profile__badges {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(4.5rem, 1fr));
      gap: var(--space-2);
    }
    .profile__badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-2);
      background: var(--color-surface-glass);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-md);
      text-align: center;
    }
    .profile__badgeIcon {
      font-size: 1.4rem;
    }
    .profile__badgeName {
      font-size: var(--text-2xs);
      color: var(--text-muted);
      line-height: var(--leading-tight);
    }
    .profile__muted {
      margin: 0;
      color: var(--text-muted);
      font-size: var(--text-sm);
    }

    @media (min-width: 480px) {
      .profile__metrics,
      .profile__actions {
        grid-template-columns: repeat(4, 1fr);
      }
    }
  `,
})
export class ProfilePage {
  private readonly gameRepo = inject(GameProgressRepository);
  private readonly digimonRepo = inject(DigimonRepository);
  private readonly player = inject(PlayerService);

  protected readonly totalAchievements = ACHIEVEMENTS.length;
  protected readonly profile = this.player.profile;
  protected readonly rank = this.player.rank;

  protected readonly partnerImage = signal(FALLBACK_IMAGE);
  private readonly masteryTracks = signal<Record<MasteryTrack, number>>({
    arena: 0,
    evolution: 0,
    field: 0,
    scan: 0,
    skill: 0,
    tactics: 0,
  });
  private readonly facts = signal<CampaignFacts | null>(null);

  protected readonly masteryRows = computed(() => {
    const tracks = this.masteryTracks();
    return (Object.keys(MASTERY_LABELS) as MasteryTrack[]).map((id) => ({
      id,
      label: MASTERY_LABELS[id],
      value: tracks[id],
    }));
  });

  protected readonly masteryMax = computed(() =>
    Math.max(60, ...Object.values(this.masteryTracks())),
  );

  private readonly progress = computed<AchievementProgress[]>(() => {
    const facts = this.facts();
    if (!facts) return [];
    const rank = this.rank();
    return evaluateAchievements(facts, {
      level: rank.level,
      streak: this.profile().streak,
      lifetimeBits: this.profile().lifetimeBits,
    });
  });

  protected readonly unlockedCount = computed(
    () => this.progress().filter((entry) => entry.unlocked).length,
  );

  protected readonly showcase = computed(() =>
    this.progress()
      .filter((entry) => entry.unlocked)
      .slice(0, 8),
  );

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    const [mastery, facts] = await Promise.all([
      this.gameRepo.mastery(),
      this.gameRepo.campaignFacts(),
    ]);
    this.masteryTracks.set(mastery.tracks);
    this.facts.set(facts);
    const partnerId = this.profile().partnerId;
    if (partnerId !== null) {
      try {
        const digimon = await this.digimonRepo.getDigimon(partnerId);
        this.partnerImage.set(digimon.image || FALLBACK_IMAGE);
      } catch {
        this.partnerImage.set(FALLBACK_IMAGE);
      }
    }
  }

  protected imgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
  }
}
