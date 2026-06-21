import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Error-state panel with a retry action. */
@Component({
  selector: 'digi-error-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="error" role="alert">
      <span class="error__icon" aria-hidden="true">⚠</span>
      <h3 class="error__title">{{ title() }}</h3>
      @if (message()) {
        <p class="error__message">{{ message() }}</p>
      }
      <button class="error__retry" type="button" (click)="retry.emit()">{{ retryLabel() }}</button>
    </div>
  `,
  styles: `
    .error {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: var(--space-3);
      padding: var(--space-10) var(--space-4);
      color: var(--text-muted);
    }
    .error__icon {
      font-size: 2.25rem;
      color: var(--color-danger-500);
      filter: drop-shadow(0 0 12px rgba(255, 59, 107, 0.45));
    }
    .error__title {
      margin: 0;
      color: var(--text-main);
    }
    .error__message {
      margin: 0;
      max-width: 40ch;
    }
    .error__retry {
      min-height: 44px;
      padding: var(--space-3) var(--space-6);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-danger-500);
      background: color-mix(in srgb, var(--color-danger-500) 14%, transparent);
      color: var(--text-main);
      font-family: var(--font-display);
      cursor: pointer;
    }
  `,
})
export class DigiErrorState {
  readonly title = input('Something glitched');
  readonly message = input<string>('');
  readonly retryLabel = input('Retry');
  readonly retry = output<void>();
}
