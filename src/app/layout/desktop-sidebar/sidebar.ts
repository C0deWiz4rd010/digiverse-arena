import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

/** Desktop sidebar navigation, grouped into clear sections (hidden on mobile). */
@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="sidebar" aria-label="Sections">
      <a
        class="sidebar__item"
        routerLink="/"
        routerLinkActive="sidebar__item--active"
        [routerLinkActiveOptions]="{ exact: true }"
      >
        <span class="sidebar__icon" aria-hidden="true">🏠</span>
        <span class="sidebar__label">Home</span>
      </a>

      @for (group of groups; track group.title) {
        <div class="sidebar__group">
          <p class="sidebar__group-title">{{ group.title }}</p>
          @for (item of group.items; track item.path) {
            <a class="sidebar__item" [routerLink]="item.path" routerLinkActive="sidebar__item--active">
              <span class="sidebar__icon" aria-hidden="true">{{ item.icon }}</span>
              <span class="sidebar__label">{{ item.label }}</span>
            </a>
          }
        </div>
      }

      <div class="sidebar__group">
        <a class="sidebar__item" routerLink="/profile" routerLinkActive="sidebar__item--active">
          <span class="sidebar__icon" aria-hidden="true">🧬</span>
          <span class="sidebar__label">Profile</span>
        </a>
        <a class="sidebar__item" routerLink="/settings" routerLinkActive="sidebar__item--active">
          <span class="sidebar__icon" aria-hidden="true">⚙️</span>
          <span class="sidebar__label">Settings</span>
        </a>
      </div>
    </nav>
  `,
  styles: `
    .sidebar {
      display: none;
    }
    @media (min-width: 1024px) {
      .sidebar {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        padding: var(--space-4) var(--space-2);
      }
    }
    .sidebar__group {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-top: var(--space-4);
    }
    .sidebar__group-title {
      margin: 0 0 var(--space-1);
      padding: 0 var(--space-3);
      font-size: 0.66rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--text-soft);
    }
    .sidebar__item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
      border-radius: var(--radius-md);
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.9rem;
      transition:
        background 0.18s ease,
        color 0.18s ease;
    }
    .sidebar__item:hover {
      background: var(--color-surface-glass);
      color: var(--text-main);
    }
    .sidebar__item--active {
      background: color-mix(in srgb, var(--color-primary-500) 14%, transparent);
      color: var(--color-primary-400);
    }
    .sidebar__icon {
      width: 1.5rem;
      text-align: center;
      font-size: 1rem;
      line-height: 1;
    }
  `,
})
export class Sidebar {
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
      title: 'Fun',
      items: [
        { path: '/minigames', label: 'Mini-Games', icon: '🕹️' },
        { path: '/achievements', label: 'Achievements', icon: '🏅' },
        { path: '/shop', label: 'Shop', icon: '🛒' },
      ],
    },
  ];
}
