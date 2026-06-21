import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Small pill chip for labels, filters and metadata. */
@Component({
  selector: 'digi-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    '[class.digi-chip--active]': 'active()',
  },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-pill);
      border: 1px solid var(--border-soft);
      background: var(--color-surface-glass);
      color: var(--text-muted);
      font-size: 0.72rem;
      font-family: var(--font-mono);
      letter-spacing: 0.04em;
      white-space: nowrap;
      line-height: 1.4;
    }
    :host(.digi-chip--active) {
      border-color: var(--color-primary-500);
      color: var(--color-primary-400);
      box-shadow: var(--shadow-neon-primary);
    }
  `,
})
export class DigiChip {
  readonly active = input(false);
}
