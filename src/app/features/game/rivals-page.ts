import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Digimon } from '../../core/models/digimon';
import { DigimonRepository } from '../../core/repositories/digimon-repository';
import { GameProgressRepository } from '../../core/repositories/game-progress-repository';
import { dayIndex, seededIndex } from '../../core/utils/seed';
import {
  createRivalSignal,
  rivalScoreLine,
  rivalWinRate,
  runRivalDuel,
  type BattleEvent,
  type RivalDuelResult,
  type RivalSignal,
} from '../../game';

const FALLBACK_IMAGE = 'assets/placeholders/digimon-fallback.svg';
const DEFAULT_TEAM = [1, 2, 3];

function imageError(event: Event): void {
  const img = event.target as HTMLImageElement;
  if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
}

function eventText(event: BattleEvent): string {
  switch (event.type) {
    case 'battle-start':
      return `Battle start: ${event.mode}${event.arenaField ? ` in ${event.arenaField}` : ''}.`;
    case 'nexus-pulse':
      return `${event.team} Nexus pulse: ${event.protocol} opens with ${event.focus} focus.`;
    case 'turn-start':
      return `Turn ${event.turn}: ${event.actorName} acts.`;
    case 'skill-used':
      return `${event.actorId} used ${event.skillName}.`;
    case 'damage':
      return `${event.targetId} took ${event.amount} damage${event.critical ? ' - critical' : ''}.`;
    case 'buff':
      return `${event.targetId} gained ${event.amount} ${event.stat}.`;
    case 'ko':
      return `${event.targetName} was knocked out.`;
    case 'battle-end':
      return `Battle ended after ${event.turns} turns: ${event.winner}.`;
  }
}

async function loadMany(repo: DigimonRepository, ids: number[]): Promise<Digimon[]> {
  const settled = await Promise.allSettled(ids.map((id) => repo.getDigimon(id)));
  return settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
}

@Component({
  selector: 'app-rivals',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="page rival-page">
      <header class="page-head tournament-hero rival-hero">
        <p class="eyebrow">Rivals</p>
        <h2>Today's rival</h2>
        <p class="lead">A new rival appears each day. Guess the best counter, then battle to earn a reward.</p>
        <div class="metric-grid">
          <div class="metric"><span class="metric__label">Threat</span><strong class="metric__value">{{ signal()?.threat ?? 0 }}</strong></div>
          <div class="metric"><span class="metric__label">Reward</span><strong class="metric__value">{{ signal()?.bountyBits ?? 0 }}</strong></div>
          <div class="metric"><span class="metric__label">Win rate</span><strong class="metric__value">{{ winRate() }}%</strong></div>
          <div class="metric"><span class="metric__label">Battles</span><strong class="metric__value">{{ history().length }}</strong></div>
        </div>
      </header>

      @if (loading()) {
        <div class="empty">Loading rival…</div>
      } @else if (error()) {
        <div class="empty">Could not load the rival. Please try again.</div>
      } @else if (signal(); as s) {
        <article class="rival-theater" [class.rival-theater--clear]="duel()?.outcome === 'clear'">
          <div class="rival-theater__image">
            <img [src]="s.rivalImage || fallbackImage" [alt]="s.rivalName" width="240" height="240" (error)="onImageError($event)" />
            <div class="rival-threat" aria-hidden="true">{{ s.tier }}</div>
          </div>
          <div class="rival-theater__body">
            <p class="eyebrow">{{ s.attribute }} · {{ s.field }}</p>
            <h3>{{ s.rivalName }}</h3>
            <p class="lead">{{ s.taunt }}</p>
            <div class="chip-row">
              <span class="chip chip--hot">{{ scoreLine(s) }}</span>
              <span class="chip">Counter {{ s.counterAttribute }}</span>
              <span class="chip">{{ s.recommendedProtocol }}</span>
            </div>
            <p class="muted">{{ s.weakness }}</p>
            <div class="rival-mutators">
              @for (mutator of s.mutators; track mutator) {
                <span>{{ mutator }}</span>
              }
            </div>
          </div>
        </article>

        <div class="split">
          <article class="panel">
            <p class="eyebrow">Your guess</p>
            <h3>{{ s.scoutQuestion }}</h3>
            <div class="choice-grid">
              @for (choice of s.scoutChoices; track choice) {
                <button
                  class="choice-card"
                  type="button"
                  [class.choice-card--picked]="counterChoice() === choice"
                  [class.choice-card--correct]="duel() && choice === s.scoutAnswer"
                  (click)="counterChoice.set(choice)"
                >
                  {{ choice }}
                </button>
              }
            </div>
            <div class="action-row">
              <button class="btn btn--primary" type="button" [disabled]="running()" (click)="duelRival()">Battle rival</button>
              <button class="btn" type="button" [disabled]="running()" (click)="rematch()">New rival</button>
              <a class="btn" routerLink="/team-builder">Open Team</a>
            </div>
          </article>

          <article class="panel">
            <p class="eyebrow">Phases</p>
            <div class="story-feed">
              @for (phase of s.phases; track phase.id) {
                <div class="story-beat">
                  <span class="story-beat__round">{{ phase.rewardBits }}</span>
                  <div>
                    <strong>{{ phase.title }}</strong>
                    <p class="muted">{{ phase.detail }}</p>
                    <div class="bar"><div class="bar__head"><span>Pressure</span><strong>{{ phase.pressure }}</strong></div><div class="bar__track"><div class="bar__fill" [style.width.%]="phase.pressure"></div></div></div>
                  </div>
                </div>
              }
            </div>
          </article>
        </div>

        <section class="split">
          <article class="panel">
            <h3>Your team</h3>
            <div class="rival-roster">
              @for (member of playerTeam(); track member.id) {
                <a class="favorite-token" [routerLink]="['/dex', member.id]">
                  <img [src]="member.image || fallbackImage" [alt]="member.name" (error)="onImageError($event)" />
                  <span>{{ member.name }}</span>
                </a>
              }
            </div>
          </article>

          <article class="panel">
            <h3>Rival team</h3>
            <div class="rival-roster">
              @for (member of enemyTeam(); track member.id) {
                <a class="favorite-token" [routerLink]="['/dex', member.id]">
                  <img [src]="member.image || fallbackImage" [alt]="member.name" (error)="onImageError($event)" />
                  <span>{{ member.name }}</span>
                </a>
              }
            </div>
          </article>
        </section>

        @if (duel(); as d) {
          <article class="rival-result" [class.rival-result--clear]="d.outcome === 'clear'">
            <div>
              <p class="eyebrow">Outcome · {{ d.outcome }}</p>
              <h3>{{ d.recap }}</h3>
              <p class="lead">{{ d.nextHook }}</p>
              <div class="chip-row">
                <span class="chip chip--hot">{{ d.rewardBits }} bits</span>
                <span class="chip">+{{ d.masteryAmount }} {{ d.masteryTrack }}</span>
                <span class="chip">{{ d.counterCorrect ? 'Counter read hit' : 'Counter read missed' }}</span>
              </div>
            </div>
            <div class="log">
              @for (line of resultLog(d); track line) {
                <div class="log__line">{{ line }}</div>
              }
            </div>
          </article>
        }

        <article class="panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">History</p>
              <h3>Recent battles</h3>
            </div>
            <a class="btn" routerLink="/collection">Open Collection</a>
          </div>
          <div class="grid">
            @for (run of history(); track run.id) {
              <div class="metric">
                <span class="metric__label">{{ run.outcome }} · {{ run.counterAttribute }}</span>
                <strong class="metric__value">{{ run.rivalName }}</strong>
                <p class="muted">{{ run.recap }}</p>
              </div>
            } @empty {
              <p class="muted">No rival battles yet.</p>
            }
          </div>
        </article>
      }
    </section>
  `,
})
export class RivalsPage {
  private readonly repo = inject(DigimonRepository);
  private readonly progress = inject(GameProgressRepository);
  protected readonly fallbackImage = FALLBACK_IMAGE;
  protected readonly signal = signal<RivalSignal | null>(null);
  protected readonly playerTeam = signal<Digimon[]>([]);
  protected readonly enemyTeam = signal<Digimon[]>([]);
  protected readonly history = signal<Awaited<ReturnType<GameProgressRepository['listRivalRuns']>>>([]);
  protected readonly duel = signal<RivalDuelResult | null>(null);
  protected readonly loading = signal(true);
  protected readonly running = signal(false);
  protected readonly error = signal(false);
  protected readonly rematchOffset = signal(0);
  protected readonly counterChoice = signal('Vaccine');
  protected readonly winRate = computed(() => rivalWinRate(this.history()));

  constructor() {
    void this.load();
  }

  protected onImageError(event: Event): void {
    imageError(event);
  }

  protected scoreLine(signal: RivalSignal): string {
    return rivalScoreLine(signal);
  }

  protected resultLog(duel: RivalDuelResult): string[] {
    return duel.result.events.slice(-12).map(eventText);
  }

  protected async rematch(): Promise<void> {
    this.rematchOffset.update((value) => value + 37);
    await this.load();
  }

  protected async duelRival(): Promise<void> {
    const signal = this.signal();
    const player = this.playerTeam();
    const enemy = this.enemyTeam();
    if (!signal || !player.length || !enemy.length) return;
    this.running.set(true);
    try {
      const result = runRivalDuel(signal, player, enemy, this.counterChoice());
      this.duel.set(result);
      await this.progress.saveBattle({
        mode: `Rival Signal: ${signal.rivalName}`,
        winner: result.result.winner,
        playerIds: player.map((digimon) => digimon.id),
        enemyIds: enemy.map((digimon) => digimon.id),
        summary: result.recap,
        events: result.result.events,
      });
      await this.progress.saveRivalRun(result);
      this.history.set(await this.progress.listRivalRuns());
    } finally {
      this.running.set(false);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    this.duel.set(null);
    try {
      const [state, savedTeams, history] = await Promise.all([
        this.progress.campaignState(),
        this.progress.listTeams(),
        this.progress.listRivalRuns(),
      ]);
      const seed = dayIndex() + this.rematchOffset();
      const rival = await this.repo.getDigimon(state.rivalDigimonId).catch(() => this.repo.getDigimon(1));
      const playerIds = savedTeams[0]?.memberIds.slice(0, 3) ?? DEFAULT_TEAM;
      const player = await loadMany(this.repo, playerIds);
      const enemy = await this.loadEnemyTeam(rival, seed);
      const signal = createRivalSignal(rival, seed);
      this.playerTeam.set(player.length ? player : await loadMany(this.repo, DEFAULT_TEAM));
      this.enemyTeam.set(enemy);
      this.signal.set(signal);
      this.counterChoice.set(signal.scoutChoices[0] ?? signal.counterAttribute);
      this.history.set(history);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadEnemyTeam(rival: Digimon, seed: number): Promise<Digimon[]> {
    const total = await this.repo.getDigimonCount().catch(() => 1200);
    const pages = await Promise.all(
      [7, 19].map((salt) =>
        this.repo.getDigimonList({
          page: seededIndex(seed + rival.id + salt, Math.max(1, total)),
          pageSize: 1,
        }),
      ),
    );
    const allyIds = pages.flatMap((page) => page.items.map((item) => item.id)).filter((id) => id !== rival.id);
    const allies = await loadMany(this.repo, allyIds);
    return [rival, ...allies].slice(0, 3);
  }
}
