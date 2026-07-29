import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { GameProgressRepository } from '../../core/repositories/game-progress-repository';
import { PlayerService } from '../../core/player/player.service';
import {
  ACHIEVEMENTS,
  CATEGORY_LABELS,
  evaluateAchievements,
  type AchievementCategory,
  type AchievementProgress,
} from '../../game/progression/achievements';
import type { CampaignFacts } from '../../game/campaign/campaign-content';

const CATEGORY_ORDER: AchievementCategory[] = [
  'explorer',
  'battler',
  'strategist',
  'collector',
  'dedication',
];

interface CategoryGroup {
  id: AchievementCategory;
  label: string;
  entries: AchievementProgress[];
  unlocked: number;
  total: number;
}

@Component({
  selector: 'app-achievements',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ach">
      <header class="ach__intro">
        <p class="ach__eyebrow">Progress</p>
        <h1 class="ach__title">Achievements</h1>
        <p class="ach__lead">
          {{ unlockedTotal() }} of {{ total }} unlocked · earn bits and titles by playing every mode.
        </p>
        <div class="ach__meter" role="meter" [attr.aria-valuenow]="unlockedTotal()" [attr.aria-valuemax]="total">
          <div class="ach__meterFill" [style.width.%]="(unlockedTotal() / total) * 100"></div>
        </div>
      </header>

      @if (loading()) {
        <p class="ach__muted">Loading progress…</p>
      } @else {
        @for (group of groups(); track group.id) {
          <section class="ach__group">
            <div class="ach__groupHead">
              <h2 class="ach__groupTitle">{{ group.label }}</h2>
              <span class="ach__groupCount">{{ group.unlocked }}/{{ group.total }}</span>
            </div>
            <div class="ach__grid">
              @for (entry of group.entries; track entry.def.id) {
                <article class="ach__card" [class.ach__card--done]="entry.unlocked">
                  <div class="ach__cardTop">
                    <span class="ach__icon" aria-hidden="true">{{ entry.def.icon }}</span>
                    @if (entry.unlocked) {
                      <span class="ach__done" aria-label="Unlocked">✓</span>
                    }
                  </div>
                  <h3 class="ach__name">{{ entry.def.title }}</h3>
                  <p class="ach__desc">{{ entry.def.description }}</p>
                  <div class="ach__bar" aria-hidden="true">
                    <div class="ach__barFill" [style.width.%]="entry.ratio * 100"></div>
                  </div>
                  <div class="ach__foot">
                    <span class="ach__progress">{{ entry.current }} / {{ entry.target }}</span>
                    <span class="ach__reward">💠 {{ entry.def.rewardBits }}</span>
                  </div>
                  @if (entry.def.rewardTitle) {
                    <span class="ach__titleReward">Title: {{ entry.def.rewardTitle }}</span>
                  }
                </article>
              }
            </div>
          </section>
        }
      }
    </section>
  `,
  styles: `
    .ach {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }
    .ach__eyebrow {
      margin: 0 0 var(--space-1);
      font-family: var(--font-mono);
      font-size: var(--text-2xs);
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--color-primary-400);
    }
    .ach__title {
      margin: 0;
      font-size: var(--text-2xl);
    }
    .ach__lead {
      margin: var(--space-2) 0 var(--space-3);
      color: var(--text-muted);
      font-size: var(--text-sm);
    }
    .ach__meter {
      height: 8px;
      border-radius: var(--radius-pill);
      background: var(--color-surface-glass);
      overflow: hidden;
    }
    .ach__meterFill {
      height: 100%;
      background: linear-gradient(90deg, var(--color-primary-500), var(--color-secondary-500));
      box-shadow: var(--shadow-neon-primary);
      transition: width 0.5s ease;
    }
    .ach__muted {
      color: var(--text-muted);
    }
    .ach__group {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    .ach__groupHead {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--space-2);
    }
    .ach__groupTitle {
      margin: 0;
      font-size: var(--text-lg);
    }
    .ach__groupCount {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-primary-400);
    }
    .ach__grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-3);
    }
    .ach__card {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-4);
      background: var(--color-surface-800);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-lg);
    }
    .ach__card--done {
      border-color: color-mix(in srgb, var(--color-success-500) 50%, var(--border-soft));
      box-shadow: 0 0 18px color-mix(in srgb, var(--color-success-500) 16%, transparent);
    }
    .ach__cardTop {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .ach__icon {
      font-size: 1.7rem;
    }
    .ach__done {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.4rem;
      height: 1.4rem;
      border-radius: 50%;
      background: var(--color-success-500);
      color: #04121c;
      font-weight: 700;
      font-size: 0.85rem;
    }
    .ach__name {
      margin: 0;
      font-size: var(--text-base);
    }
    .ach__desc {
      margin: 0;
      color: var(--text-muted);
      font-size: var(--text-xs);
      line-height: var(--leading-normal);
    }
    .ach__bar {
      height: 6px;
      border-radius: var(--radius-pill);
      background: var(--color-surface-glass);
      overflow: hidden;
    }
    .ach__barFill {
      height: 100%;
      background: linear-gradient(90deg, var(--color-primary-500), var(--color-secondary-500));
      transition: width 0.5s ease;
    }
    .ach__foot {
      display: flex;
      justify-content: space-between;
      font-family: var(--font-mono);
      font-size: var(--text-2xs);
    }
    .ach__progress {
      color: var(--text-soft);
    }
    .ach__reward {
      color: var(--color-accent-500);
    }
    .ach__titleReward {
      font-size: var(--text-2xs);
      color: var(--color-secondary-500);
    }

    @media (min-width: 600px) {
      .ach__grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (min-width: 1024px) {
      .ach__grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  `,
})
export class AchievementsPage {
  private readonly gameRepo = inject(GameProgressRepository);
  private readonly player = inject(PlayerService);

  protected readonly total = ACHIEVEMENTS.length;
  protected readonly loading = signal(true);
  private readonly facts = signal<CampaignFacts | null>(null);

  private readonly progress = computed<AchievementProgress[]>(() => {
    const facts = this.facts();
    if (!facts) return [];
    const rank = this.player.rank();
    return evaluateAchievements(facts, {
      level: rank.level,
      streak: this.player.profile().streak,
      lifetimeBits: this.player.profile().lifetimeBits,
    });
  });

  protected readonly unlockedTotal = computed(
    () => this.progress().filter((entry) => entry.unlocked).length,
  );

  protected readonly groups = computed<CategoryGroup[]>(() => {
    const all = this.progress();
    return CATEGORY_ORDER.map((id) => {
      const entries = all.filter((entry) => entry.def.category === id);
      return {
        id,
        label: CATEGORY_LABELS[id],
        entries,
        unlocked: entries.filter((entry) => entry.unlocked).length,
        total: entries.length,
      };
    }).filter((group) => group.total > 0);
  });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    const facts = await this.gameRepo.campaignFacts();
    this.facts.set(facts);
    this.loading.set(false);
  }
}
