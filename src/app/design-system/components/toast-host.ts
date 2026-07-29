import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/feedback/toast.service';

/** Renders the global toast queue above the bottom navigation. */
@Component({
  selector: 'digi-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite" aria-atomic="false">
      @for (toast of toasts(); track toast.id) {
        <button
          type="button"
          class="toast"
          [class.toast--reward]="toast.tone === 'reward'"
          [class.toast--success]="toast.tone === 'success'"
          (click)="dismiss(toast.id)"
        >
          <span class="toast__icon" aria-hidden="true">{{ toast.icon }}</span>
          <span class="toast__body">
            <span class="toast__title">{{ toast.title }}</span>
            @if (toast.message) {
              <span class="toast__msg">{{ toast.message }}</span>
            }
          </span>
        </button>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + var(--space-3));
      z-index: var(--z-toast);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      width: min(24rem, calc(100vw - var(--space-6)));
      pointer-events: none;
    }
    @media (min-width: 1024px) {
      .toasts {
        left: auto;
        right: var(--space-5);
        transform: none;
        bottom: var(--space-5);
      }
    }
    .toast {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: var(--space-3);
      width: 100%;
      padding: var(--space-3) var(--space-4);
      text-align: left;
      background: var(--color-surface-900);
      border: 1px solid var(--border-soft);
      border-left: 3px solid var(--color-primary-500);
      border-radius: var(--radius-md);
      color: var(--text-main);
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.4);
      cursor: pointer;
    }
    @media (prefers-reduced-motion: no-preference) {
      .toast {
        animation: toast-in 0.28s ease;
      }
    }
    .toast--success {
      border-left-color: var(--color-success-500);
    }
    .toast--reward {
      border-left-color: var(--color-accent-500);
    }
    .toast__icon {
      font-size: 1.4rem;
      line-height: 1;
    }
    .toast__body {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .toast__title {
      font-size: var(--text-sm);
      font-weight: 700;
    }
    .toast__msg {
      font-size: var(--text-xs);
      color: var(--text-muted);
    }
    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
})
export class ToastHost {
  private readonly toastService = inject(ToastService);
  protected readonly toasts = this.toastService.toasts;

  protected dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
