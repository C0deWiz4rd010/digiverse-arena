import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { attributeColorVar } from './attribute-color';

/** Color-coded badge for a Digimon attribute (Vaccine / Virus / Data / Free / Unknown). */
@Component({
  selector: 'digi-attribute-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [style.--attr-color]="color()">
      <span class="badge__dot" aria-hidden="true"></span>
      {{ attribute() }}
    </span>
  `,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-pill);
      border: 1px solid var(--attr-color);
      color: var(--attr-color);
      background: color-mix(in srgb, var(--attr-color) 12%, transparent);
      font-size: 0.74rem;
      font-weight: 600;
      letter-spacing: 0.03em;
    }
    .badge__dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: var(--attr-color);
      box-shadow: 0 0 8px var(--attr-color);
    }
  `,
})
export class DigiAttributeBadge {
  readonly attribute = input.required<string>();
  protected readonly color = computed(() => attributeColorVar(this.attribute()));
}
