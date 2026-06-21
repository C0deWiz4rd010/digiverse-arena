import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type DigiButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type DigiButtonSize = 'sm' | 'md' | 'lg';

/** Neon cyber button. Touch targets stay >= 44px on the `md`/`lg` sizes. */
@Component({
  selector: 'digi-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="digi-btn"
      [class]="'digi-btn--' + variant() + ' digi-btn--' + size()"
      [class.digi-btn--block]="block()"
      [attr.type]="type()"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel() || null"
      (click)="pressed.emit($event)"
    >
      <ng-content />
    </button>
  `,
  styles: `
    :host {
      display: inline-block;
    }
    :host(.block),
    .digi-btn--block {
      width: 100%;
    }
    .digi-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      width: 100%;
      border: 1px solid transparent;
      border-radius: var(--radius-md);
      font-family: var(--font-display);
      font-weight: 600;
      letter-spacing: 0.03em;
      cursor: pointer;
      transition:
        transform 0.12s ease,
        box-shadow 0.2s ease,
        background 0.2s ease;
    }
    .digi-btn:active {
      transform: translateY(1px) scale(0.99);
    }
    .digi-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .digi-btn--sm {
      padding: var(--space-2) var(--space-3);
      font-size: 0.8rem;
    }
    .digi-btn--md {
      min-height: 44px;
      padding: var(--space-3) var(--space-5);
      font-size: 0.9rem;
    }
    .digi-btn--lg {
      min-height: 52px;
      padding: var(--space-4) var(--space-6);
      font-size: 1rem;
    }
    .digi-btn--primary {
      background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-400));
      color: #04121b;
      box-shadow: var(--shadow-neon-primary);
    }
    .digi-btn--secondary {
      background: linear-gradient(135deg, var(--color-secondary-500), #a78bfa);
      color: #0a0420;
      box-shadow: var(--shadow-neon-purple);
    }
    .digi-btn--ghost {
      background: var(--color-surface-glass);
      border-color: var(--border-soft);
      color: var(--text-main);
    }
    .digi-btn--danger {
      background: linear-gradient(135deg, var(--color-danger-500), #ff6b8f);
      color: #1a0408;
    }
  `,
})
export class DigiButton {
  readonly variant = input<DigiButtonVariant>('primary');
  readonly size = input<DigiButtonSize>('md');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  readonly block = input(false);
  readonly ariaLabel = input<string>('');
  readonly pressed = output<MouseEvent>();
}
