import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

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
        <span class="bottom-nav__icon" aria-hidden="true">☰</span>
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
      transition: color 0.18s ease;
    }
    .bottom-nav__icon {
      font-size: 1.1rem;
      line-height: 1;
    }
    .bottom-nav__item--active {
      color: var(--color-primary-400);
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
      max-height: 78vh;
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
  protected readonly menuOpen = signal(false);

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
        { path: '/minigames', label: 'Mini-Games', icon: '🕹️' },
        { path: '/settings', label: 'Settings', icon: '⚙️' },
      ],
    },
  ];

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected navigate(path: string): void {
    this.closeMenu();
    void this.router.navigate([path]);
  }
}
