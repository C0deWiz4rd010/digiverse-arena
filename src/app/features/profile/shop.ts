import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PlayerService } from '../../core/player/player.service';
import { SettingsService } from '../../core/settings/settings.service';
import { SoundService } from '../../core/feedback/sound.service';
import { HapticsService } from '../../core/feedback/haptics.service';
import { ToastService } from '../../core/feedback/toast.service';
import { SHOP_THEMES, SHOP_TITLES, type ShopThemeItem, type ShopTitleItem } from '../../game/progression/shop';

@Component({
  selector: 'app-shop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="shop">
      <header class="shop__intro">
        <div>
          <p class="shop__eyebrow">Nexus Exchange</p>
          <h1 class="shop__title">Shop</h1>
        </div>
        <span class="shop__wallet" title="Your bits">💠 {{ bits() }}</span>
      </header>
      <p class="shop__lead">Spend bits earned across every mode on themes and prestige titles.</p>

      <section class="shop__section">
        <h2 class="shop__h2">Neon themes</h2>
        <div class="shop__grid">
          @for (item of themes; track item.id) {
            <article class="shop__card" [style.--sw1]="item.swatch[0]" [style.--sw2]="item.swatch[1]">
              <span class="shop__swatch" aria-hidden="true"></span>
              <h3 class="shop__name">{{ item.label }}</h3>
              <p class="shop__hint">{{ item.hint }}</p>
              @if (owns(item.id)) {
                @if (activeTheme() === item.id) {
                  <span class="shop__equipped">Active</span>
                } @else {
                  <button type="button" class="shop__btn" (click)="equipTheme(item)">Equip</button>
                }
              } @else {
                <button
                  type="button"
                  class="shop__btn shop__btn--buy"
                  [disabled]="bits() < item.price"
                  (click)="buyTheme(item)"
                >
                  💠 {{ item.price }}
                </button>
              }
            </article>
          }
        </div>
      </section>

      <section class="shop__section">
        <h2 class="shop__h2">Prestige titles</h2>
        <div class="shop__grid shop__grid--titles">
          @for (item of titles; track item.id) {
            <article class="shop__card shop__card--title">
              <h3 class="shop__name">{{ item.label }}</h3>
              <p class="shop__hint">{{ item.hint }}</p>
              @if (ownsTitle(item.id)) {
                @if (activeTitle() === item.id) {
                  <span class="shop__equipped">Equipped</span>
                } @else {
                  <button type="button" class="shop__btn" (click)="equipTitle(item)">Equip</button>
                }
              } @else {
                <button
                  type="button"
                  class="shop__btn shop__btn--buy"
                  [disabled]="bits() < item.price"
                  (click)="buyTitle(item)"
                >
                  💠 {{ item.price }}
                </button>
              }
            </article>
          }
        </div>
      </section>
    </section>
  `,
  styles: `
    .shop {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
    .shop__intro {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-3);
    }
    .shop__eyebrow {
      margin: 0 0 var(--space-1);
      font-family: var(--font-mono);
      font-size: var(--text-2xs);
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--color-primary-400);
    }
    .shop__title {
      margin: 0;
      font-size: var(--text-2xl);
    }
    .shop__wallet {
      flex-shrink: 0;
      padding: var(--space-2) var(--space-3);
      background: var(--color-surface-800);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-pill);
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      color: var(--color-accent-500);
    }
    .shop__lead {
      margin: 0;
      color: var(--text-muted);
      font-size: var(--text-sm);
    }
    .shop__section {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    .shop__h2 {
      margin: 0;
      font-size: var(--text-lg);
    }
    .shop__grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-3);
    }
    .shop__card {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-4);
      background: var(--color-surface-800);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-lg);
    }
    .shop__card--title {
      justify-content: space-between;
    }
    .shop__swatch {
      height: 3.5rem;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--sw1), var(--sw2));
      box-shadow: 0 0 18px color-mix(in srgb, var(--sw1) 40%, transparent);
    }
    .shop__name {
      margin: 0;
      font-size: var(--text-base);
    }
    .shop__hint {
      margin: 0;
      flex: 1;
      color: var(--text-soft);
      font-size: var(--text-xs);
    }
    .shop__btn {
      min-height: 44px;
      padding: var(--space-2) var(--space-3);
      background: var(--color-surface-glass);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-md);
      color: var(--text-main);
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      cursor: pointer;
    }
    .shop__btn--buy {
      border-color: color-mix(in srgb, var(--color-accent-500) 45%, var(--border-soft));
      color: var(--color-accent-500);
    }
    .shop__btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .shop__equipped {
      align-self: flex-start;
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-pill);
      background: color-mix(in srgb, var(--color-success-500) 20%, transparent);
      color: var(--color-success-500);
      font-size: var(--text-xs);
      font-weight: 700;
    }

    @media (min-width: 640px) {
      .shop__grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  `,
})
export class ShopPage {
  private readonly player = inject(PlayerService);
  private readonly settings = inject(SettingsService);
  private readonly soundFx = inject(SoundService);
  private readonly hapticsFx = inject(HapticsService);
  private readonly toasts = inject(ToastService);

  protected readonly themes = SHOP_THEMES;
  protected readonly titles = SHOP_TITLES;
  protected readonly bits = this.player.bits;
  protected readonly activeTheme = this.settings.theme;
  protected readonly activeTitle = computed(() => this.player.profile().title);

  protected owns(theme: ShopThemeItem['id']): boolean {
    return this.player.isThemeUnlocked(theme);
  }

  protected ownsTitle(id: string): boolean {
    return this.player.profile().unlockedTitles.includes(id);
  }

  protected async buyTheme(item: ShopThemeItem): Promise<void> {
    const ok = await this.player.spendBits(item.price);
    if (!ok) {
      this.notEnough();
      return;
    }
    await this.player.unlockTheme(item.id);
    this.settings.setTheme(item.id);
    this.win(`${item.label} unlocked`, 'Theme equipped.');
  }

  protected equipTheme(item: ShopThemeItem): void {
    this.settings.setTheme(item.id);
    this.soundFx.play('select');
    this.hapticsFx.vibrate('select');
  }

  protected async buyTitle(item: ShopTitleItem): Promise<void> {
    const ok = await this.player.spendBits(item.price);
    if (!ok) {
      this.notEnough();
      return;
    }
    await this.player.equipTitle(item.id);
    this.win(`${item.label} unlocked`, 'Title equipped.');
  }

  protected async equipTitle(item: ShopTitleItem): Promise<void> {
    await this.player.equipTitle(item.id);
    this.soundFx.play('select');
    this.hapticsFx.vibrate('select');
  }

  private win(title: string, message: string): void {
    this.soundFx.play('coin');
    this.hapticsFx.vibrate('reward');
    this.toasts.reward(title, message, '🛒');
  }

  private notEnough(): void {
    this.soundFx.play('error');
    this.toasts.push({ title: 'Not enough bits', message: 'Play a mode to earn more.', icon: '💠', tone: 'info' });
  }
}
