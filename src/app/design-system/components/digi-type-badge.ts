import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Neutral badge for a Digimon type (Reptile, Holy Beast, ...). */
@Component({
  selector: 'digi-type-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content>{{ type() }}</ng-content>`,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-soft);
      background: var(--color-surface-glass);
      color: var(--text-muted);
      font-size: 0.72rem;
      letter-spacing: 0.03em;
    }
  `,
})
export class DigiTypeBadge {
  readonly type = input<string>('');
}
