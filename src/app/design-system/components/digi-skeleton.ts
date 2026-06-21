import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Shimmer skeleton placeholder to avoid layout shift while loading. */
@Component({
  selector: 'digi-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ``,
  host: {
    '[style.width]': 'width()',
    '[style.height]': 'height()',
    '[style.border-radius]': 'radius()',
    role: 'presentation',
    'aria-hidden': 'true',
  },
  styles: `
    :host {
      display: block;
      background: linear-gradient(
        100deg,
        var(--color-surface-800) 30%,
        var(--color-surface-glass) 50%,
        var(--color-surface-800) 70%
      );
      background-size: 200% 100%;
    }
    @media (prefers-reduced-motion: no-preference) {
      :host {
        animation: digi-shimmer 1.4s ease-in-out infinite;
      }
    }
    @keyframes digi-shimmer {
      from {
        background-position: 200% 0;
      }
      to {
        background-position: -200% 0;
      }
    }
  `,
})
export class DigiSkeleton {
  readonly width = input('100%');
  readonly height = input('1rem');
  readonly radius = input('var(--radius-sm)');
}
