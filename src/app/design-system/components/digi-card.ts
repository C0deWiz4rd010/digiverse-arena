import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Glassmorphism surface card. Optional neon glow + interactive hover lift. */
@Component({
  selector: 'digi-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    '[class.digi-card--interactive]': 'interactive()',
    '[class.digi-card--glow]': 'glow()',
  },
  styles: `
    :host {
      display: block;
      position: relative;
      background: var(--color-surface-800);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    :host(.digi-card--interactive) {
      cursor: pointer;
      transition:
        transform 0.18s ease,
        box-shadow 0.25s ease,
        border-color 0.2s ease;
    }
    @media (prefers-reduced-motion: no-preference) {
      :host(.digi-card--interactive:hover) {
        transform: translateY(-3px);
        border-color: var(--color-primary-500);
        box-shadow: var(--shadow-neon-primary);
      }
    }
    :host(.digi-card--glow) {
      box-shadow: var(--shadow-neon-primary);
    }
  `,
})
export class DigiCard {
  readonly interactive = input(false);
  readonly glow = input(false);
}
