import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { DigimonListItem } from '../../core/models/digimon';
import { DigimonRepository } from '../../core/repositories/digimon-repository';
import { GameProgressRepository } from '../../core/repositories/game-progress-repository';
import { dayIndex, seededIndex } from '../../core/utils/seed';
import { MINI_GAMES, miniGameChallenge, type MiniGameChallenge, type MiniGameDefinition } from '../../game';

const FALLBACK_IMAGE = 'assets/placeholders/digimon-fallback.svg';

@Component({
  selector: 'app-minigames',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="page mini-page">
      <header class="page-head tournament-hero">
        <p class="eyebrow">// DigiCore Arcade</p>
        <h2>Mini-Games from live DAPI signals</h2>
        <p class="lead">Short challenges turn images, names, attributes, Fields and evolution hints into rewards that feed the daily campaign.</p>
        <div class="metric-grid">
          <div class="metric"><span class="metric__label">Modes</span><strong class="metric__value">{{ games.length }}</strong></div>
          <div class="metric"><span class="metric__label">Streak</span><strong class="metric__value">{{ streak() }}</strong></div>
          <div class="metric"><span class="metric__label">Pool</span><strong class="metric__value">{{ pool().length }}</strong></div>
        </div>
      </header>

      <div class="mini-mode-grid">
        @for (game of games; track game.id) {
          <button class="mini-game-card" type="button" [class.mini-game-card--selected]="selectedId() === game.id" (click)="launch(game)">
            <span class="eyebrow">{{ game.verb }} // {{ game.track }}</span>
            <strong>{{ game.title }}</strong>
            <span>{{ game.description }}</span>
            <span class="chip chip--hot">{{ game.rewardBits }} bits</span>
          </button>
        }
      </div>

      @if (loading()) {
        <div class="empty">Loading DAPI challenge pool...</div>
      } @else if (error()) {
        <div class="empty">The DAPI signal dropped. Reopen the arcade or try again later.</div>
      } @else if (challenge(); as c) {
        <article class="mini-theater" [class.mini-theater--win]="result() === 'win'" [class.mini-theater--loss]="result() === 'loss'">
          <div class="mini-theater__visual">
            @if (target(); as t) {
              <img [src]="t.image || fallbackImage" [alt]="t.name" width="220" height="220" (error)="onImageError($event)" />
            }
            <div class="mini-pulse" aria-hidden="true"></div>
          </div>
          <div class="mini-theater__content">
            <p class="eyebrow">{{ c.title }}</p>
            <h3>{{ c.prompt }}</h3>
            <p class="lead">{{ c.hint }}</p>
            <div class="choice-grid">
              @for (choice of c.choices; track choice) {
                <button
                  class="choice-card"
                  type="button"
                  [disabled]="result() !== null"
                  [class.choice-card--correct]="result() !== null && choice === c.answer"
                  [class.choice-card--picked]="choice === picked()"
                  (click)="answer(c, choice)"
                >
                  {{ choice }}
                </button>
              }
            </div>
            @if (result()) {
              <div class="campaign-toast" role="status">
                <strong>{{ result() === 'win' ? 'Correct signal' : 'Signal missed' }}</strong>
                <span>{{ resultText() }}</span>
              </div>
              <div class="action-row">
                <button class="btn btn--primary" type="button" (click)="reroll()">Next challenge</button>
                <a class="btn" routerLink="/collection">Open archive</a>
              </div>
            }
          </div>
        </article>
      }
    </section>
  `,
})
export class MiniGamesPage {
  private readonly repo = inject(DigimonRepository);
  private readonly progress = inject(GameProgressRepository);
  protected readonly games = MINI_GAMES;
  protected readonly fallbackImage = FALLBACK_IMAGE;
  protected readonly pool = signal<DigimonListItem[]>([]);
  protected readonly challenge = signal<MiniGameChallenge | null>(null);
  protected readonly selectedId = signal(MINI_GAMES[0].id);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly result = signal<'win' | 'loss' | null>(null);
  protected readonly picked = signal('');
  protected readonly streak = signal(0);
  private readonly runIndex = signal(0);
  protected readonly target = computed(() => this.pool().find((item) => item.name === this.challenge()?.answer) ?? null);
  protected readonly resultText = computed(() => {
    const c = this.challenge();
    if (!c) return '';
    if (this.result() === 'win') return `+${c.rewardBits} bits and ${c.track} mastery recorded.`;
    return `Answer was ${c.answer}. You still earned practice mastery.`;
  });

  constructor() {
    void this.load();
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
  }

  protected launch(game: MiniGameDefinition): void {
    this.selectedId.set(game.id);
    this.result.set(null);
    this.picked.set('');
    this.challenge.set(miniGameChallenge(game.id, this.pool(), dayIndex() + this.runIndex()));
  }

  protected reroll(): void {
    this.runIndex.update((value) => value + 17);
    const game = this.games.find((entry) => entry.id === this.selectedId()) ?? this.games[0];
    this.launch(game);
  }

  protected async answer(challenge: MiniGameChallenge, choice: string): Promise<void> {
    if (this.result()) return;
    const result = choice === challenge.answer ? 'win' : 'loss';
    this.picked.set(choice);
    this.result.set(result);
    this.streak.update((value) => (result === 'win' ? value + 1 : 0));
    await this.progress.recordMiniGame(challenge.id, result, result === 'win' ? challenge.rewardBits : 0, challenge.track);
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      const total = await this.repo.getDigimonCount();
      const page = seededIndex(dayIndex() + 91, Math.max(1, Math.ceil(total / 48)));
      const result = await this.repo.getDigimonList({ page, pageSize: 48 });
      this.pool.set(result.items.length ? result.items : (await this.repo.getDigimonList({ page: 0, pageSize: 48 })).items);
      this.launch(this.games[0]);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
