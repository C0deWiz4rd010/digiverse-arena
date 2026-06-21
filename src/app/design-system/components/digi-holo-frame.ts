import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Holographic frame wrapper used around artwork and feature cards. */
@Component({
  selector: 'digi-holo-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="holo" [style.--glow]="glow()">
      <span class="holo__corner holo__corner--tl" aria-hidden="true"></span>
      <span class="holo__corner holo__corner--tr" aria-hidden="true"></span>
      <span class="holo__corner holo__corner--bl" aria-hidden="true"></span>
      <span class="holo__corner holo__corner--br" aria-hidden="true"></span>
      <ng-content />
    </div>
  `,
  styles: `
    .holo {
      position: relative;
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      background: var(--color-surface-900);
      border: 1px solid color-mix(in srgb, var(--glow) 40%, var(--border-soft));
      box-shadow: 0 0 28px color-mix(in srgb, var(--glow) 30%, transparent);
      overflow: hidden;
    }
    .holo::before {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent 0,
        transparent 3px,
        color-mix(in srgb, var(--glow) 6%, transparent) 4px
      );
      pointer-events: none;
    }
    .holo__corner {
      position: absolute;
      width: 14px;
      height: 14px;
      border: 2px solid var(--glow);
    }
    .holo__corner--tl {
      top: 6px;
      left: 6px;
      border-right: 0;
      border-bottom: 0;
    }
    .holo__corner--tr {
      top: 6px;
      right: 6px;
      border-left: 0;
      border-bottom: 0;
    }
    .holo__corner--bl {
      bottom: 6px;
      left: 6px;
      border-right: 0;
      border-top: 0;
    }
    .holo__corner--br {
      bottom: 6px;
      right: 6px;
      border-left: 0;
      border-top: 0;
    }
  `,
})
export class DigiHoloFrame {
  readonly glow = input('var(--color-primary-500)');
}
