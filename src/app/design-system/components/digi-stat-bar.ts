import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Animated stat bar (HP / Attack / ...) with a neon fill. */
@Component({
  selector: 'digi-stat-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stat">
      <div class="stat__head">
        <span class="stat__label">{{ label() }}</span>
        <span class="stat__value">{{ value() }}</span>
      </div>
      <div
        class="stat__track"
        role="meter"
        [attr.aria-valuenow]="value()"
        [attr.aria-valuemin]="0"
        [attr.aria-valuemax]="max()"
        [attr.aria-label]="label()"
      >
        <div class="stat__fill" [style.width.%]="percent()"></div>
      </div>
    </div>
  `,
  styles: `
    .stat__head {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      margin-bottom: var(--space-1);
    }
    .stat__label {
      color: var(--text-muted);
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .stat__value {
      font-family: var(--font-mono);
      color: var(--text-main);
    }
    .stat__track {
      height: 8px;
      border-radius: var(--radius-pill);
      background: var(--color-surface-glass);
      overflow: hidden;
    }
    .stat__fill {
      height: 100%;
      border-radius: var(--radius-pill);
      background: linear-gradient(90deg, var(--color-primary-500), var(--color-secondary-500));
      box-shadow: var(--shadow-neon-primary);
      transition: width 0.5s ease;
    }
  `,
})
export class DigiStatBar {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly max = input(150);
  protected readonly percent = computed(() =>
    Math.max(0, Math.min(100, (this.value() / this.max()) * 100)),
  );
}
