import { ChangeDetectionStrategy, Component, NgZone, OnDestroy, inject, signal } from '@angular/core';

/** Floating "back to top" button that appears after the user scrolls down. */
@Component({
  selector: 'digi-scroll-top',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <button type="button" class="fab" (click)="toTop()" aria-label="Scroll to top">↑</button>
    }
  `,
  styles: `
    .fab {
      position: fixed;
      right: var(--space-4);
      bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + var(--space-4));
      z-index: var(--z-nav);
      width: 3rem;
      height: 3rem;
      display: grid;
      place-items: center;
      border: 1px solid var(--border-soft);
      border-radius: 50%;
      background: var(--color-surface-900);
      color: var(--color-primary-400);
      font-size: 1.3rem;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    @media (prefers-reduced-motion: no-preference) {
      .fab {
        animation: fab-in 0.24s ease;
      }
    }
    .fab:active {
      transform: scale(0.9);
    }
    @media (min-width: 1024px) {
      .fab {
        bottom: var(--space-6);
      }
    }
    @keyframes fab-in {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
})
export class ScrollTopFab implements OnDestroy {
  private readonly zone = inject(NgZone);
  protected readonly visible = signal(false);
  private readonly onScroll = () => this.visible.set((globalThis.scrollY ?? 0) > 480);

  constructor() {
    this.zone.runOutsideAngular(() => {
      globalThis.addEventListener?.('scroll', this.onScroll, { passive: true });
    });
  }

  ngOnDestroy(): void {
    globalThis.removeEventListener?.('scroll', this.onScroll);
  }

  protected toTop(): void {
    globalThis.scrollTo?.({ top: 0, behavior: 'smooth' });
  }
}
