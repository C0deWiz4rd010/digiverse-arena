import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

/** Desktop sidebar navigation (hidden on mobile, where the bottom nav is used). */
@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="sidebar" aria-label="Sections">
      @for (item of items; track item.path) {
        <a
          class="sidebar__item"
          [routerLink]="item.path"
          routerLinkActive="sidebar__item--active"
          [routerLinkActiveOptions]="{ exact: item.path === '/' }"
        >
          <span class="sidebar__icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="sidebar__label">{{ item.label }}</span>
        </a>
      }
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
    .sidebar__item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
      border-radius: var(--radius-md);
      color: var(--text-muted);
      text-decoration: none;
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
      font-family: var(--font-mono);
      font-size: 0.82rem;
      font-weight: 800;
    }
  `,
})
export class Sidebar {
  protected readonly items: NavItem[] = [
    { path: '/', label: 'Home', icon: 'HM' },
    { path: '/dex', label: 'DigiDex', icon: 'DX' },
    { path: '/evolution-lab', label: 'Evolution Lab', icon: 'EV' },
    { path: '/fields', label: 'Fields', icon: 'FD' },
    { path: '/expeditions', label: 'Expeditions', icon: 'EX' },
    { path: '/skills', label: 'Skills', icon: 'SK' },
    { path: '/skill-forge', label: 'Skill Forge', icon: 'SF' },
    { path: '/team-builder', label: 'Squad Lab', icon: 'SQ' },
    { path: '/nexus', label: 'Nexus Lab', icon: 'NX' },
    { path: '/arena', label: 'Arena', icon: 'AR' },
    { path: '/random-battle', label: 'Random Battle', icon: 'RB' },
    { path: '/rivals', label: 'Rival Signal', icon: 'RV' },
    { path: '/minigames', label: 'Mini-Games', icon: 'MG' },
    { path: '/tournaments', label: 'Tournaments', icon: 'TR' },
    { path: '/compare', label: 'Scouter Duel', icon: 'SC' },
    { path: '/collection', label: 'Collection', icon: 'CL' },
    { path: '/settings', label: 'Settings', icon: 'ST' },
  ];
}
