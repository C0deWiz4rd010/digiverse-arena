import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const PALETTE = [
  ['#00e5ff', '#8b5cf6'],
  ['#ff2d6b', '#ff8a3c'],
  ['#17f0a0', '#12b6ff'],
  ['#3d9bff', '#7c5cff'],
  ['#a86bff', '#ff5cc4'],
  ['#ffb703', '#ff5c8a'],
];

/**
 * Deterministic tamer avatar: a seeded neon gradient disc with the tamer's initial.
 * No images required — the seed maps to a stable palette + rotation.
 */
@Component({
  selector: 'digi-tamer-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="avatar"
      [style.--g1]="colors()[0]"
      [style.--g2]="colors()[1]"
      [style.--angle.deg]="angle()"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.font-size.px]="size() * 0.44"
      [attr.aria-label]="name() ? name() + ' avatar' : 'Tamer avatar'"
      role="img"
    >
      <span aria-hidden="true">{{ initial() }}</span>
    </span>
  `,
  styles: `
    .avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: conic-gradient(from calc(var(--angle) * 1deg), var(--g1), var(--g2), var(--g1));
      color: #05121c;
      font-family: var(--font-display);
      font-weight: 700;
      line-height: 1;
      border: 1px solid rgba(255, 255, 255, 0.25);
      box-shadow: 0 0 12px color-mix(in srgb, var(--g1) 50%, transparent);
      flex-shrink: 0;
    }
  `,
})
export class TamerAvatar {
  readonly seed = input(0);
  readonly name = input('');
  readonly size = input(36);

  protected readonly colors = computed(() => PALETTE[Math.abs(this.seed()) % PALETTE.length]);
  protected readonly angle = computed(() => Math.abs(this.seed()) % 360);
  protected readonly initial = computed(() => {
    const name = this.name().trim();
    return name ? name[0]!.toUpperCase() : '◈';
  });
}
