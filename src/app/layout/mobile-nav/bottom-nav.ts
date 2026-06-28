import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

/** Mobile bottom navigation with the 5 primary destinations. */
@Component({
  selector: 'app-bottom-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav" aria-label="Primary">
      @for (item of items; track item.path) {
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
    </nav>
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
      color: var(--text-soft);
      font-size: 0.66rem;
      letter-spacing: 0.03em;
      text-decoration: none;
      transition: color 0.18s ease;
    }
    .bottom-nav__icon {
      font-family: var(--font-mono);
      font-size: 0.82rem;
      font-weight: 800;
      line-height: 1;
    }
    .bottom-nav__item--active {
      color: var(--color-primary-400);
      text-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
    }
    @media (min-width: 1024px) {
      .bottom-nav {
        display: none;
      }
    }
  `,
})
export class BottomNav {
  protected readonly items: NavItem[] = [
    { path: '/', label: 'Home', icon: 'HM' },
    { path: '/dex', label: 'Dex', icon: 'DX' },
    { path: '/arena', label: 'Arena', icon: 'AR' },
    { path: '/rivals', label: 'Rival', icon: 'RV' },
    { path: '/minigames', label: 'Mini', icon: 'MG' },
  ];
}
