import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { GameProgressRepository } from '../../core/repositories/game-progress-repository';
import { SoundService } from '../../core/feedback/sound.service';
import { HapticsService } from '../../core/feedback/haptics.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

/** Mobile bottom navigation: 4 primary tabs + a "More" sheet for everything else. */
@Component({
  selector: 'app-bottom-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav" aria-label="Primary">
      @for (item of primary; track item.path) {
        <a
          class="bottom-nav__item"
          [routerLink]="item.path"
          routerLinkActive="bottom-nav__item--active"
          [routerLinkActiveOptions]="{ exact: item.path === '/' }"
          (click)="tap()"
        >
          <span class="bottom-nav__icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="bottom-nav__label">{{ item.label }}</span>
        </a>
      }
      <button
        type="button"
        class="bottom-nav__item"
        [class.bottom-nav__item--active]="menuOpen()"
        (click)="toggleMenu()"
        aria-label="More sections"
      >
        <span class="bottom-nav__icon" aria-hidden="true">
          ☰
          @if (claimable() > 0) {
            <span class="bottom-nav__badge" [attr.aria-label]="claimable() + ' rewards ready'">
              {{ claimable() }}
            </span>
          }
        </span>
        <span class="bottom-nav__label">More</span>
      </button>
    </nav>

    @if (menuOpen()) {
      <div class="sheet" role="dialog" aria-label="All sections">
        <button type="button" class="sheet__backdrop" aria-label="Close" (click)="closeMenu()"></button>
        <div class="sheet__panel">
          <div class="sheet__handle" aria-hidden="true"></div>
          @for (group of groups; track group.title) {
            <p class="sheet__title">{{ group.title }}</p>
            <div class="sheet__grid">
              @for (item of group.items; track item.path) {
                <button type="button" class="sheet__item" (click)="navigate(item.path)">
                  <span class="sheet__icon" aria-hidden="true">{{ item.icon }}</span>
                  <span class="sheet__label">{{ item.label }}</span>
                </button>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: `
    .bottom-nav {
      position: sticky;
      bottom: 0;
      z-index: var(--z-nav);
      display: flex;
      justify-content: space-around;
      align-items: stretch;
      height: var(--bottom-nav-height);
      padding-bottom: env(safe-area-inset-bottom);
      background: var(--color-surface-900);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-top: 1px solid var(--border-soft);
    }
    .bottom-nav__item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      flex: 1;
      min-width: 44px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-soft);
      font-size: 0.66rem;
      letter-spacing: 0.03em;
      text-decoration: none;
      transition:
        color 0.18s ease,
        transform 0.12s ease;
    }
    .bottom-nav__item:active {
      transform: scale(0.92);
    }
    .bottom-nav__icon {
      position: relative;
      font-size: 1.1rem;
      line-height: 1;
      transition: transform 0.18s ease;
    }
    .bottom-nav__item--active {
      color: var(--color-primary-400);
    }
    .bottom-nav__item--active .bottom-nav__icon {
      transform: translateY(-2px) scale(1.12);
      filter: drop-shadow(0 0 8px color-mix(in srgb, var(--color-primary-400) 60%, transparent));
    }
    .bottom-nav__item--active::before {
      content: '';
      position: absolute;
      top: 0;
      width: 26px;
      height: 3px;
      border-radius: var(--radius-pill);
      background: var(--color-primary-400);
      box-shadow: var(--shadow-neon-primary);
    }
    .bottom-nav__badge {
      position: absolute;
      top: -6px;
      right: -10px;
      min-width: 15px;
      height: 15px;
      padding: 0 4px;
      border-radius: var(--radius-pill);
      background: var(--color-accent-500);
      color: #1a0d03;
      font-family: var(--font-mono);
      font-size: 0.58rem;
      font-weight: 700;
      line-height: 15px;
      text-align: center;
    }
    .sheet {
      position: fixed;
      inset: 0;
      z-index: var(--z-overlay);
    }
    .sheet__backdrop {
      position: absolute;
      inset: 0;
      border: none;
      background: rgba(0, 0, 0, 0.55);
    }
    .sheet__panel {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      max-height: min(78vh, calc(100dvh - 3rem));
      overflow-y: auto;
      padding: var(--space-3) var(--space-4) calc(var(--space-6) + env(safe-area-inset-bottom));
      background: var(--color-bg-900);
      border-top: 1px solid var(--border-soft);
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    }
    .sheet__handle {
      width: 2.5rem;
      height: 4px;
      margin: 0 auto var(--space-4);
      border-radius: var(--radius-pill);
      background: var(--border-soft);
    }
    .sheet__title {
      margin: var(--space-4) 0 var(--space-2);
      font-size: 0.66rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--text-soft);
    }
    .sheet__grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-2);
    }
    .sheet__item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3);
      background: var(--color-surface-glass);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-md);
      color: var(--text-main);
      font-size: 0.72rem;
      cursor: pointer;
    }
    .sheet__item:active {
      background: color-mix(in srgb, var(--color-primary-500) 16%, transparent);
    }
    .sheet__icon {
      font-size: 1.35rem;
      line-height: 1;
    }
    @media (min-width: 1024px) {
      .bottom-nav,
      .sheet {
        display: none;
      }
    }
  `,
})
export class BottomNav {
  private readonly router = inject(Router);
  private readonly progress = inject(GameProgressRepository);
  private readonly sound = inject(SoundService);
  private readonly haptics = inject(HapticsService);
  protected readonly menuOpen = signal(false);
  protected readonly claimable = signal(0);

  constructor() {
    void this.refreshBadge();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => void this.refreshBadge());
  }

  protected readonly primary: NavItem[] = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/dex', label: 'DigiDex', icon: '📖' },
    { path: '/arena', label: 'Arena', icon: '⚔️' },
    { path: '/team-builder', label: 'Team', icon: '🛡️' },
  ];

  protected readonly groups: NavGroup[] = [
    {
      title: 'Explore',
      items: [
        { path: '/dex', label: 'DigiDex', icon: '📖' },
        { path: '/fields', label: 'Fields', icon: '🌐' },
        { path: '/skills', label: 'Skills', icon: '✨' },
        { path: '/compare', label: 'Compare', icon: '⚖️' },
      ],
    },
    {
      title: 'Battle',
      items: [
        { path: '/arena', label: 'Arena', icon: '⚔️' },
        { path: '/random-battle', label: 'Quick Battle', icon: '🎲' },
        { path: '/rivals', label: 'Rivals', icon: '🎯' },
        { path: '/tournaments', label: 'Tournaments', icon: '🏆' },
        { path: '/expeditions', label: 'Expeditions', icon: '🧭' },
      ],
    },
    {
      title: 'Build',
      items: [
        { path: '/team-builder', label: 'Team', icon: '🛡️' },
        { path: '/skill-forge', label: 'Skill Training', icon: '🔧' },
        { path: '/nexus', label: 'Synergy', icon: '🔗' },
        { path: '/collection', label: 'Collection', icon: '📁' },
      ],
    },
    {
      title: 'More',
      items: [
        { path: '/profile', label: 'Profile', icon: '🧬' },
        { path: '/achievements', label: 'Achievements', icon: '🏅' },
        { path: '/shop', label: 'Shop', icon: '🛒' },
        { path: '/minigames', label: 'Mini-Games', icon: '🕹️' },
        { path: '/settings', label: 'Settings', icon: '⚙️' },
      ],
    },
  ];

  protected toggleMenu(): void {
    this.tap();
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected navigate(path: string): void {
    this.tap();
    this.closeMenu();
    void this.router.navigate([path]);
  }

  protected tap(): void {
    this.sound.tap();
    this.haptics.tap();
  }

  private async refreshBadge(): Promise<void> {
    try {
      const quests = await this.progress.dailyQuestBoard();
      this.claimable.set(quests.filter((quest) => quest.status === 'claimable').length);
    } catch {
      this.claimable.set(0);
    }
  }
}
