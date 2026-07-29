import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DigimonRepository } from '../../core/repositories/digimon-repository';
import { GameProgressRepository } from '../../core/repositories/game-progress-repository';
import { PlayerService } from '../../core/player/player.service';
import { SettingsService } from '../../core/settings/settings.service';
import { SoundService } from '../../core/feedback/sound.service';
import { HapticsService } from '../../core/feedback/haptics.service';
import { ToastService } from '../../core/feedback/toast.service';
import { THEME_OPTIONS, type MotionMode, type ThemeId } from '../../core/settings/settings.model';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="set">
      <header class="set__intro">
        <p class="set__eyebrow">Settings</p>
        <h1 class="set__title">Personalize DigiVerse</h1>
        <p class="set__lead">Everything is stored on your device.</p>
      </header>

      <!-- Appearance -->
      <article class="set__card">
        <h2 class="set__h2">Appearance</h2>
        <p class="set__hint">Pick a neon theme. Locked themes are unlocked in the Shop.</p>
        <div class="set__themes">
          @for (option of themes; track option.id) {
            <button
              type="button"
              class="set__theme"
              [class.set__theme--on]="theme() === option.id"
              [class.set__theme--locked]="!isUnlocked(option.id)"
              [style.--sw1]="option.swatch[0]"
              [style.--sw2]="option.swatch[1]"
              (click)="pickTheme(option.id)"
            >
              <span class="set__swatch" aria-hidden="true"></span>
              <span class="set__themeMeta">
                <span class="set__themeName">{{ option.label }}</span>
                <span class="set__themeHint">{{ isUnlocked(option.id) ? option.hint : 'Locked' }}</span>
              </span>
              @if (!isUnlocked(option.id)) {
                <span class="set__lock" aria-hidden="true">🔒</span>
              } @else if (theme() === option.id) {
                <span class="set__check" aria-hidden="true">✓</span>
              }
            </button>
          }
        </div>
        <a routerLink="/shop" class="set__inlineLink">Unlock more themes in the Shop →</a>
      </article>

      <!-- Motion -->
      <article class="set__card">
        <h2 class="set__h2">Motion</h2>
        <p class="set__hint">Reduce or disable animations for comfort or performance.</p>
        <div class="set__seg">
          @for (option of motionOptions; track option.value) {
            <button
              type="button"
              class="set__segBtn"
              [class.set__segBtn--on]="motion() === option.value"
              (click)="setMotion(option.value)"
            >
              {{ option.label }}
            </button>
          }
        </div>
      </article>

      <!-- Sound -->
      <article class="set__card">
        <div class="set__row">
          <div>
            <h2 class="set__h2">Sound effects</h2>
            <p class="set__hint">Synth blips for taps and rewards.</p>
          </div>
          <button
            type="button"
            class="set__switch"
            role="switch"
            [attr.aria-checked]="sound()"
            [class.set__switch--on]="sound()"
            (click)="toggleSound()"
          >
            <span class="set__knob"></span>
          </button>
        </div>
        @if (sound()) {
          <label class="set__slider">
            <span>Volume</span>
            <input
              type="range"
              min="0"
              max="100"
              [value]="volumePct()"
              (input)="setVolume($event)"
            />
            <button type="button" class="set__test" (click)="testSound()">Test</button>
          </label>
        }
      </article>

      <!-- Haptics -->
      <article class="set__card">
        <div class="set__row">
          <div>
            <h2 class="set__h2">Haptics</h2>
            <p class="set__hint">Vibration feedback on supported devices.</p>
          </div>
          <button
            type="button"
            class="set__switch"
            role="switch"
            [attr.aria-checked]="haptics()"
            [class.set__switch--on]="haptics()"
            (click)="toggleHaptics()"
          >
            <span class="set__knob"></span>
          </button>
        </div>
        @if (haptics()) {
          <button type="button" class="set__test set__test--block" (click)="testHaptics()">
            Test vibration
          </button>
        }
      </article>

      <!-- Performance -->
      <article class="set__card">
        <h2 class="set__h2">Performance</h2>
        <div class="set__row">
          <div>
            <p class="set__label">Data saver</p>
            <p class="set__hint">Skip non-essential network work.</p>
          </div>
          <button
            type="button"
            class="set__switch"
            role="switch"
            [attr.aria-checked]="dataSaver()"
            [class.set__switch--on]="dataSaver()"
            (click)="toggleDataSaver()"
          >
            <span class="set__knob"></span>
          </button>
        </div>
        <div class="set__row">
          <div>
            <p class="set__label">Reduce effects</p>
            <p class="set__hint">Drop blur + glow for smoother low-end rendering.</p>
          </div>
          <button
            type="button"
            class="set__switch"
            role="switch"
            [attr.aria-checked]="reduceEffects()"
            [class.set__switch--on]="reduceEffects()"
            (click)="toggleReduceEffects()"
          >
            <span class="set__knob"></span>
          </button>
        </div>
      </article>

      <!-- Account -->
      <article class="set__card">
        <h2 class="set__h2">Account</h2>
        <label class="set__field">
          <span class="set__label">Tamer name</span>
          <div class="set__inline">
            <input
              class="set__input"
              type="text"
              maxlength="20"
              [value]="nameDraft()"
              (input)="onName($event)"
            />
            <button type="button" class="set__btn" (click)="saveName()">Save</button>
          </div>
        </label>
        <div class="set__inline set__inline--wrap">
          <button type="button" class="set__btn" (click)="exportSave()">Export save</button>
          <label class="set__btn set__btn--file">
            Import save
            <input type="file" accept="application/json" (change)="importSave($event)" hidden />
          </label>
        </div>
      </article>

      <!-- Data -->
      <article class="set__card">
        <h2 class="set__h2">Data</h2>
        <div class="set__row">
          <div>
            <p class="set__label">Cached Digimon data</p>
            <p class="set__hint">Re-downloaded on demand.</p>
          </div>
          <button type="button" class="set__btn" (click)="clearCache()">Clear cache</button>
        </div>
        <div class="set__row">
          <div>
            <p class="set__label">All progress</p>
            <p class="set__hint">Favorites, teams, history, profile — can't be undone.</p>
          </div>
          <button type="button" class="set__btn set__btn--danger" (click)="resetAll()">Reset</button>
        </div>
      </article>
    </section>
  `,
  styles: `
    .set {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
    .set__eyebrow {
      margin: 0 0 var(--space-1);
      font-family: var(--font-mono);
      font-size: var(--text-2xs);
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--color-primary-400);
    }
    .set__title {
      margin: 0;
      font-size: var(--text-2xl);
    }
    .set__lead {
      margin: var(--space-2) 0 0;
      color: var(--text-muted);
      font-size: var(--text-sm);
    }
    .set__card {
      padding: var(--space-4);
      background: var(--color-surface-800);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-lg);
    }
    .set__h2 {
      margin: 0;
      font-size: var(--text-base);
    }
    .set__label {
      margin: 0;
      font-size: var(--text-sm);
      font-weight: 600;
    }
    .set__hint {
      margin: var(--space-1) 0 0;
      color: var(--text-soft);
      font-size: var(--text-xs);
    }
    .set__themes {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-2);
      margin: var(--space-3) 0 var(--space-2);
    }
    .set__theme {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-3);
      background: var(--color-surface-glass);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-md);
      color: var(--text-main);
      cursor: pointer;
      text-align: left;
    }
    .set__theme--on {
      border-color: var(--color-primary-400);
      box-shadow: var(--shadow-neon-primary);
    }
    .set__theme--locked {
      opacity: 0.62;
    }
    .set__swatch {
      width: 2rem;
      height: 2rem;
      border-radius: var(--radius-sm);
      background: linear-gradient(135deg, var(--sw1), var(--sw2));
      flex-shrink: 0;
    }
    .set__themeMeta {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .set__themeName {
      font-size: var(--text-sm);
      font-weight: 600;
    }
    .set__themeHint {
      font-size: var(--text-2xs);
      color: var(--text-soft);
    }
    .set__lock,
    .set__check {
      margin-left: auto;
      font-size: 1rem;
    }
    .set__check {
      color: var(--color-primary-400);
    }
    .set__inlineLink {
      font-size: var(--text-xs);
    }
    .set__seg {
      display: flex;
      gap: var(--space-2);
      margin-top: var(--space-3);
    }
    .set__segBtn {
      flex: 1;
      min-height: 44px;
      padding: var(--space-2);
      background: var(--color-surface-glass);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-md);
      color: var(--text-muted);
      font-size: var(--text-sm);
      cursor: pointer;
    }
    .set__segBtn--on {
      border-color: var(--color-primary-400);
      color: var(--color-primary-400);
    }
    .set__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-2) 0;
    }
    .set__row + .set__row {
      border-top: 1px solid var(--border-soft);
    }
    .set__switch {
      position: relative;
      width: 3rem;
      height: 1.7rem;
      flex-shrink: 0;
      padding: 0;
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-pill);
      background: var(--color-surface-glass);
      cursor: pointer;
    }
    .set__switch--on {
      background: color-mix(in srgb, var(--color-primary-500) 40%, transparent);
      border-color: var(--color-primary-400);
    }
    .set__knob {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 1.3rem;
      height: 1.3rem;
      border-radius: 50%;
      background: var(--text-main);
      transition: transform 0.18s ease;
    }
    .set__switch--on .set__knob {
      transform: translateX(1.3rem);
      background: var(--color-primary-400);
    }
    .set__slider {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-top: var(--space-3);
      font-size: var(--text-xs);
      color: var(--text-muted);
    }
    .set__slider input[type='range'] {
      flex: 1;
      accent-color: var(--color-primary-500);
    }
    .set__test {
      padding: var(--space-2) var(--space-3);
      background: var(--color-surface-glass);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-md);
      color: var(--text-main);
      font-size: var(--text-xs);
      cursor: pointer;
    }
    .set__test--block {
      margin-top: var(--space-3);
      width: 100%;
      min-height: 44px;
    }
    .set__field {
      display: block;
      margin-top: var(--space-3);
    }
    .set__inline {
      display: flex;
      gap: var(--space-2);
      margin-top: var(--space-2);
    }
    .set__inline--wrap {
      flex-wrap: wrap;
    }
    .set__input {
      flex: 1;
      min-width: 0;
      padding: var(--space-2) var(--space-3);
      background: var(--color-bg-900);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-md);
      color: var(--text-main);
      font-size: var(--text-base);
    }
    .set__btn {
      min-height: 44px;
      padding: var(--space-2) var(--space-4);
      background: var(--color-surface-glass);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-md);
      color: var(--text-main);
      font-size: var(--text-sm);
      cursor: pointer;
    }
    .set__btn--file {
      display: inline-flex;
      align-items: center;
    }
    .set__btn--danger {
      border-color: color-mix(in srgb, var(--color-danger-500) 55%, transparent);
      color: var(--color-danger-500);
    }

    @media (min-width: 560px) {
      .set__themes {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `,
})
export class SettingsPage {
  private readonly repo = inject(DigimonRepository);
  private readonly progress = inject(GameProgressRepository);
  private readonly player = inject(PlayerService);
  private readonly settings = inject(SettingsService);
  private readonly soundFx = inject(SoundService);
  private readonly hapticsFx = inject(HapticsService);
  private readonly toasts = inject(ToastService);

  protected readonly themes = THEME_OPTIONS;
  protected readonly motionOptions: { value: MotionMode; label: string }[] = [
    { value: 'full', label: 'Full' },
    { value: 'reduced', label: 'Reduced' },
    { value: 'off', label: 'Off' },
  ];

  protected readonly theme = this.settings.theme;
  protected readonly motion = this.settings.motion;
  protected readonly sound = this.settings.sound;
  protected readonly haptics = this.settings.haptics;
  protected readonly dataSaver = this.settings.dataSaver;
  protected readonly reduceEffects = this.settings.reduceEffects;
  protected readonly volumePct = computed(() => Math.round(this.settings.soundVolume() * 100));
  protected readonly nameDraft = signal(this.player.profile().tamerName);

  protected isUnlocked(theme: ThemeId): boolean {
    return this.player.isThemeUnlocked(theme);
  }

  protected pickTheme(theme: ThemeId): void {
    if (!this.isUnlocked(theme)) {
      this.toasts.push({ title: 'Theme locked', message: 'Unlock it in the Shop with bits.', icon: '🔒', tone: 'info' });
      return;
    }
    this.soundFx.play('select');
    this.hapticsFx.vibrate('select');
    this.settings.setTheme(theme);
  }

  protected setMotion(motion: MotionMode): void {
    this.settings.setMotion(motion);
  }

  protected toggleSound(): void {
    this.settings.setSound(!this.sound());
    if (this.settings.sound()) this.soundFx.play('select');
  }

  protected setVolume(event: Event): void {
    this.settings.setSoundVolume(Number((event.target as HTMLInputElement).value) / 100);
  }

  protected testSound(): void {
    this.soundFx.play('reward');
  }

  protected toggleHaptics(): void {
    this.settings.setHaptics(!this.haptics());
    if (this.settings.haptics()) this.hapticsFx.vibrate('select');
  }

  protected testHaptics(): void {
    this.hapticsFx.vibrate('success');
  }

  protected toggleDataSaver(): void {
    this.settings.setDataSaver(!this.dataSaver());
  }

  protected toggleReduceEffects(): void {
    this.settings.setReduceEffects(!this.reduceEffects());
  }

  protected onName(event: Event): void {
    this.nameDraft.set((event.target as HTMLInputElement).value);
  }

  protected async saveName(): Promise<void> {
    await this.player.updateIdentity({ tamerName: this.nameDraft() });
    this.toasts.success('Saved', 'Tamer name updated.');
  }

  protected exportSave(): void {
    const blob = new Blob([this.player.exportSave()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'digiverse-save.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  protected async importSave(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    const ok = await this.player.importSave(text);
    input.value = '';
    if (ok) {
      this.nameDraft.set(this.player.profile().tamerName);
      this.toasts.success('Imported', 'Save restored.');
    } else {
      this.toasts.push({ title: 'Import failed', message: 'That file is not a valid save.', icon: '⚠️', tone: 'info' });
    }
  }

  protected async clearCache(): Promise<void> {
    await this.repo.clearCache();
    this.toasts.success('Cache cleared', 'Digimon data will re-download.');
  }

  protected async resetAll(): Promise<void> {
    await this.progress.clearUserData();
    this.player.resetLocal();
    this.settings.reset();
    this.nameDraft.set(this.player.profile().tamerName);
    this.toasts.success('Progress reset', 'Everything was cleared.');
  }
}
