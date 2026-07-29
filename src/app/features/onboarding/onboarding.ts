import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { DigimonRepository } from '../../core/repositories/digimon-repository';
import { PlayerService } from '../../core/player/player.service';
import { SettingsService } from '../../core/settings/settings.service';
import { SoundService } from '../../core/feedback/sound.service';
import { HapticsService } from '../../core/feedback/haptics.service';
import { THEME_OPTIONS, type MotionMode, type ThemeId } from '../../core/settings/settings.model';
import type { DigimonListItem } from '../../core/models/digimon';

const FALLBACK_IMAGE = 'assets/placeholders/digimon-fallback.svg';
const NAME_IDEAS = ['Nova', 'Rhea', 'Kaze', 'Orion', 'Vela', 'Juno', 'Zephyr', 'Echo', 'Riko', 'Sol'];

interface PartnerOption {
  id: number;
  name: string;
  image: string;
}

@Component({
  selector: 'app-onboarding',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="onboard">
      <div class="onboard__panel">
        <div class="onboard__progress" aria-hidden="true">
          @for (n of steps; track n) {
            <span class="onboard__dot" [class.onboard__dot--on]="n <= step()"></span>
          }
        </div>

        <!-- Step 1: identity -->
        @if (step() === 1) {
          <header class="onboard__head">
            <p class="onboard__eyebrow">Welcome, Tamer</p>
            <h1 class="onboard__title">Boot your DigiVerse profile</h1>
            <p class="onboard__lead">Pick a tamer name. You can change it any time in Settings.</p>
          </header>
          <label class="onboard__field">
            <span class="onboard__label">Tamer name</span>
            <input
              class="onboard__input"
              type="text"
              maxlength="20"
              [value]="name()"
              (input)="onName($event)"
              placeholder="Enter a name"
              autocomplete="off"
            />
          </label>
          <button type="button" class="onboard__ghost" (click)="rollName()">🎲 Suggest a name</button>
          <div class="onboard__actions">
            <button type="button" class="onboard__skip" (click)="skip()">Skip setup</button>
            <button type="button" class="onboard__next" [disabled]="!name().trim()" (click)="go(2)">
              Next
            </button>
          </div>
        }

        <!-- Step 2: partner -->
        @if (step() === 2) {
          <header class="onboard__head">
            <p class="onboard__eyebrow">Step 2</p>
            <h1 class="onboard__title">Choose your partner</h1>
            <p class="onboard__lead">Your partner represents you across the DigiVerse.</p>
          </header>
          @if (loadingPartners()) {
            <p class="onboard__muted">Scanning the network…</p>
          } @else {
            <div class="onboard__partners">
              @for (option of partners(); track option.id) {
                <button
                  type="button"
                  class="onboard__partner"
                  [class.onboard__partner--on]="partnerId() === option.id"
                  (click)="pickPartner(option)"
                >
                  <img [src]="option.image" [alt]="option.name" (error)="imgError($event)" loading="lazy" />
                  <span>{{ option.name }}</span>
                </button>
              }
            </div>
          }
          <button type="button" class="onboard__ghost" (click)="rerollPartners()">🔄 Show others</button>
          <div class="onboard__actions">
            <button type="button" class="onboard__skip" (click)="go(1)">Back</button>
            <button type="button" class="onboard__next" [disabled]="partnerId() === null" (click)="go(3)">
              Next
            </button>
          </div>
        }

        <!-- Step 3: theme + motion -->
        @if (step() === 3) {
          <header class="onboard__head">
            <p class="onboard__eyebrow">Step 3</p>
            <h1 class="onboard__title">Make it yours</h1>
            <p class="onboard__lead">Pick a neon theme and your motion comfort. Both live in Settings later.</p>
          </header>
          <span class="onboard__label">Theme</span>
          <div class="onboard__themes">
            @for (option of themes; track option.id) {
              <button
                type="button"
                class="onboard__theme"
                [class.onboard__theme--on]="theme() === option.id"
                [style.--sw1]="option.swatch[0]"
                [style.--sw2]="option.swatch[1]"
                (click)="pickTheme(option.id)"
              >
                <span class="onboard__swatch" aria-hidden="true"></span>
                <span class="onboard__themeName">{{ option.label }}</span>
              </button>
            }
          </div>
          <span class="onboard__label">Motion</span>
          <div class="onboard__motion">
            @for (option of motionOptions; track option.value) {
              <button
                type="button"
                class="onboard__chip"
                [class.onboard__chip--on]="motion() === option.value"
                (click)="pickMotion(option.value)"
              >
                {{ option.label }}
              </button>
            }
          </div>
          <div class="onboard__actions">
            <button type="button" class="onboard__skip" (click)="go(2)">Back</button>
            <button type="button" class="onboard__next" (click)="finish()">Enter DigiVerse</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-height: calc(100dvh - var(--topbar-height) - var(--bottom-nav-height));
    }
    .onboard {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-4);
    }
    .onboard__panel {
      width: 100%;
      max-width: 30rem;
      padding: var(--space-6) var(--space-5) var(--space-5);
      background: var(--color-surface-900);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-neon-primary);
    }
    .onboard__progress {
      display: flex;
      gap: var(--space-2);
      justify-content: center;
      margin-bottom: var(--space-5);
    }
    .onboard__dot {
      width: 2rem;
      height: 4px;
      border-radius: var(--radius-pill);
      background: var(--border-soft);
      transition: background 0.2s ease;
    }
    .onboard__dot--on {
      background: var(--color-primary-400);
    }
    .onboard__head {
      margin-bottom: var(--space-4);
      text-align: center;
    }
    .onboard__eyebrow {
      margin: 0 0 var(--space-1);
      font-family: var(--font-mono);
      font-size: var(--text-2xs);
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--color-primary-400);
    }
    .onboard__title {
      margin: 0 0 var(--space-2);
      font-size: var(--text-xl);
    }
    .onboard__lead,
    .onboard__muted {
      margin: 0;
      color: var(--text-muted);
      font-size: var(--text-sm);
      line-height: var(--leading-normal);
    }
    .onboard__muted {
      text-align: center;
      padding: var(--space-6) 0;
    }
    .onboard__field {
      display: block;
      margin: var(--space-4) 0 var(--space-2);
    }
    .onboard__label {
      display: block;
      margin-bottom: var(--space-2);
      font-size: var(--text-xs);
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-soft);
    }
    .onboard__input {
      width: 100%;
      padding: var(--space-3);
      background: var(--color-bg-900);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-md);
      color: var(--text-main);
      font-size: var(--text-base);
    }
    .onboard__input:focus-visible {
      outline: 2px solid var(--color-primary-400);
      outline-offset: 1px;
    }
    .onboard__ghost {
      margin: var(--space-2) 0 0;
      padding: var(--space-2) var(--space-3);
      background: none;
      border: 1px dashed var(--border-soft);
      border-radius: var(--radius-md);
      color: var(--text-muted);
      font-size: var(--text-sm);
      cursor: pointer;
    }
    .onboard__partners {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-2);
      margin: var(--space-3) 0;
    }
    .onboard__partner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-2);
      background: var(--color-surface-glass);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-md);
      color: var(--text-main);
      font-size: var(--text-2xs);
      cursor: pointer;
      transition:
        border-color 0.18s ease,
        transform 0.18s ease;
    }
    .onboard__partner img {
      width: 100%;
      aspect-ratio: 1;
      object-fit: contain;
    }
    .onboard__partner--on {
      border-color: var(--color-primary-400);
      box-shadow: var(--shadow-neon-primary);
    }
    .onboard__partner:active {
      transform: scale(0.97);
    }
    .onboard__themes {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-2);
      margin-bottom: var(--space-4);
    }
    .onboard__theme {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2);
      background: var(--color-surface-glass);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-md);
      color: var(--text-main);
      font-size: var(--text-xs);
      cursor: pointer;
    }
    .onboard__theme--on {
      border-color: var(--color-primary-400);
    }
    .onboard__swatch {
      width: 1.6rem;
      height: 1.6rem;
      border-radius: var(--radius-sm);
      background: linear-gradient(135deg, var(--sw1), var(--sw2));
      flex-shrink: 0;
    }
    .onboard__motion {
      display: flex;
      gap: var(--space-2);
      margin-bottom: var(--space-5);
    }
    .onboard__chip {
      flex: 1;
      padding: var(--space-2);
      background: var(--color-surface-glass);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-pill);
      color: var(--text-muted);
      font-size: var(--text-xs);
      cursor: pointer;
    }
    .onboard__chip--on {
      border-color: var(--color-primary-400);
      color: var(--color-primary-400);
    }
    .onboard__actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-3);
      margin-top: var(--space-4);
    }
    .onboard__skip {
      background: none;
      border: none;
      color: var(--text-soft);
      font-size: var(--text-sm);
      cursor: pointer;
      min-height: 44px;
      padding: 0 var(--space-2);
    }
    .onboard__next {
      flex: 1;
      max-width: 14rem;
      min-height: 44px;
      padding: var(--space-3) var(--space-5);
      background: linear-gradient(120deg, var(--color-primary-500), var(--color-secondary-500));
      border: none;
      border-radius: var(--radius-md);
      color: #04121c;
      font-weight: 700;
      font-size: var(--text-sm);
      cursor: pointer;
    }
    .onboard__next:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
})
export class OnboardingPage {
  private readonly repo = inject(DigimonRepository);
  private readonly player = inject(PlayerService);
  private readonly settings = inject(SettingsService);
  private readonly sound = inject(SoundService);
  private readonly haptics = inject(HapticsService);
  private readonly router = inject(Router);

  protected readonly steps = [1, 2, 3];
  protected readonly themes = THEME_OPTIONS;
  protected readonly motionOptions: { value: MotionMode; label: string }[] = [
    { value: 'full', label: 'Full' },
    { value: 'reduced', label: 'Reduced' },
    { value: 'off', label: 'Off' },
  ];

  protected readonly step = signal(1);
  protected readonly name = signal(NAME_IDEAS[Math.floor(Math.random() * NAME_IDEAS.length)]);
  protected readonly partners = signal<PartnerOption[]>([]);
  protected readonly loadingPartners = signal(false);
  protected readonly partnerId = signal<number | null>(null);
  protected readonly partnerName = signal('');
  protected readonly theme = signal<ThemeId>(this.settings.theme());
  protected readonly motion = signal<MotionMode>(this.settings.motion());

  protected readonly selectedPartner = computed(() =>
    this.partners().find((option) => option.id === this.partnerId()) ?? null,
  );

  protected onName(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }

  protected rollName(): void {
    this.feedbackTap();
    this.name.set(NAME_IDEAS[Math.floor(Math.random() * NAME_IDEAS.length)]);
  }

  protected go(step: number): void {
    this.feedbackTap();
    this.step.set(step);
    if (step === 2 && this.partners().length === 0) void this.loadPartners();
  }

  protected pickPartner(option: PartnerOption): void {
    this.sound.play('select');
    this.haptics.vibrate('select');
    this.partnerId.set(option.id);
    this.partnerName.set(option.name);
  }

  protected rerollPartners(): void {
    this.feedbackTap();
    void this.loadPartners();
  }

  protected pickTheme(theme: ThemeId): void {
    this.sound.play('select');
    this.haptics.vibrate('select');
    this.theme.set(theme);
    this.settings.setTheme(theme); // live preview
  }

  protected pickMotion(motion: MotionMode): void {
    this.feedbackTap();
    this.motion.set(motion);
    this.settings.setMotion(motion); // live preview
  }

  protected async finish(): Promise<void> {
    this.sound.play('success');
    this.haptics.vibrate('success');
    this.settings.setMotion(this.motion());
    await this.player.createProfile({
      tamerName: this.name(),
      partnerId: this.partnerId(),
      partnerName: this.partnerName(),
      theme: this.theme(),
    });
    void this.router.navigate(['/']);
  }

  protected async skip(): Promise<void> {
    await this.player.skipOnboarding();
    void this.router.navigate(['/']);
  }

  protected imgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
  }

  private async loadPartners(): Promise<void> {
    this.loadingPartners.set(true);
    try {
      const page = Math.floor(Math.random() * 90);
      const result = await this.repo.getDigimonList({ page, pageSize: 12 });
      const options = result.items
        .filter((item: DigimonListItem) => Boolean(item.image))
        .slice(0, 6)
        .map((item: DigimonListItem) => ({ id: item.id, name: item.name, image: item.image || FALLBACK_IMAGE }));
      this.partners.set(options.length ? options : this.partners());
    } catch {
      this.partners.set([]);
    } finally {
      this.loadingPartners.set(false);
    }
  }

  private feedbackTap(): void {
    this.sound.tap();
    this.haptics.tap();
  }
}
