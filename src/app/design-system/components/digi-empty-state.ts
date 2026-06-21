import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Empty-state panel with an icon glyph, message and optional projected action. */
@Component({
  selector: 'digi-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty" role="status">
      <span class="empty__icon" aria-hidden="true">{{ icon() }}</span>
      <h3 class="empty__title">{{ title() }}</h3>
      @if (message()) {
        <p class="empty__message">{{ message() }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: var(--space-2);
      padding: var(--space-10) var(--space-4);
      color: var(--text-muted);
    }
    .empty__icon {
      font-size: 2.5rem;
      filter: drop-shadow(0 0 12px rgba(0, 229, 255, 0.4));
    }
    .empty__title {
      margin: 0;
      color: var(--text-main);
      font-size: 1.1rem;
    }
    .empty__message {
      margin: 0;
      max-width: 38ch;
    }
  `,
})
export class DigiEmptyState {
  readonly icon = input('◍');
  readonly title = input.required<string>();
  readonly message = input<string>('');
}
