import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { Digimon } from '../../core/models/digimon';
import { DigimonRepository } from '../../core/repositories/digimon-repository';
import { GameProgressRepository } from '../../core/repositories/game-progress-repository';
import {
  TOURNAMENTS,
  TOURNAMENT_STRATEGIES,
  questCompletion,
  runTournament,
  tournamentSummary,
  type BattleEvent,
  type DigiCoreQuest,
  type TournamentDefinition,
  type TournamentMatch,
  type TournamentMoment,
  type TournamentRewardOption,
  type TournamentRun,
  type TournamentStrategy,
  type TournamentStrategyId,
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
  selector: 'app-tournaments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page tournament-page">
      <header class="page-head tournament-hero tournament-hero--broadcast">
        <p class="eyebrow">Tournaments</p>
        <h2>Tournaments</h2>
        <p class="lead">Pick an event and a strategy, run the bracket, then reveal each round and claim a reward.</p>
        <div class="metric-grid">
          <div class="metric"><span class="metric__label">Events</span><strong class="metric__value">{{ tournaments.length }}</strong></div>
          <div class="metric"><span class="metric__label">Strategies</span><strong class="metric__value">{{ strategies.length }}</strong></div>
          <div class="metric"><span class="metric__label">Rounds shown</span><strong class="metric__value">{{ revealedRounds() }}/{{ current()?.phases?.length ?? 0 }}</strong></div>
        </div>
        <div class="tournament-loop">
          <span>1. Pick event</span>
          <span>2. Choose strategy</span>
          <span>3. Reveal rounds</span>
          <span>4. Claim reward</span>
        </div>
      </header>

      <section class="quest-strip" aria-label="Tournament campaign quests">
        @for (quest of quests().slice(0, 3); track quest.id) {
          <article class="quest-card" [class.quest-card--ready]="quest.status === 'claimable'" [class.quest-card--claimed]="quest.status === 'claimed'">
            <div class="quest-card__top"><span>{{ quest.track }}</span><strong>{{ questCompletion(quest) }}%</strong></div>
            <h3>{{ quest.title }}</h3>
            <p class="muted">{{ quest.description }}</p>
            <div class="campaign-progress"><span [style.width.%]="questCompletion(quest)"></span></div>
            <button class="btn" type="button" [disabled]="quest.status !== 'claimable'" (click)="claimQuest(quest)">
              {{ quest.status === 'claimed' ? 'Claimed' : 'Claim reward' }}
            </button>
          </article>
        }
      </section>

      <section class="tournament-command">
        <div>
          <p class="eyebrow">Selected event</p>
          <h3>{{ selectedTournament().name }}</h3>
          <p class="lead">{{ selectedTournament().tagline }}</p>
          <div class="chip-row">
            <span class="chip">{{ selectedTournament().sponsor }}</span>
            <span class="chip">{{ selectedTournament().format }}</span>
            <span class="chip">{{ selectedTournament().size }} seeds</span>
            <span class="chip chip--hot">{{ selectedTournament().difficulty }}/5 threat</span>
          </div>
        </div>
        <div>
          <p class="eyebrow">Strategy</p>
          <h3>{{ selectedStrategy().label }}</h3>
          <p class="lead">{{ selectedStrategy().stance }}</p>
          <div class="action-row">
            <button class="btn btn--primary" type="button" [disabled]="running()" (click)="run()">Run bracket</button>
            <button class="btn" type="button" [disabled]="!current() || revealComplete()" (click)="revealNext()">Reveal next round</button>
            <button class="btn" type="button" [disabled]="!current()" (click)="revealAll()">Reveal all</button>
          </div>
        </div>
      </section>

      @if (toast()) {
        <div class="tournament-toast" role="status">{{ toast() }}</div>
      }

      <section>
        <div class="section-head">
          <div>
            <p class="eyebrow">Events</p>
            <h3>Choose an event</h3>
          </div>
        </div>
        <div class="grid grid--wide tournament-grid">
          @for (tournament of tournaments; track tournament.id) {
            <article class="bracket-card tournament-card" [class.tournament-card--selected]="selectedTournament().id === tournament.id">
              <p class="eyebrow">{{ tournament.sponsor }} · {{ tournament.format }}</p>
              <h3>{{ tournament.name }}</h3>
              <p class="lead">{{ tournament.tagline }}</p>
              <p class="muted">{{ tournament.description }}</p>
              <div class="difficulty" [attr.aria-label]="'Difficulty ' + tournament.difficulty + ' of 5'">
                @for (pip of difficultyPips(tournament); track $index) {
                  <span class="difficulty__pip" [class.difficulty__pip--on]="pip"></span>
                }
              </div>
              <div class="chip-row">
                <span class="chip">{{ tournament.size }} seeds</span>
                <span class="chip">{{ tournament.teamSize }} per team</span>
                <span class="chip">{{ tournament.field || 'Neutral Field' }}</span>
                <span class="chip chip--hot">{{ tournament.reward }}</span>
              </div>
              <div class="chip-row">
                @for (modifier of tournament.modifiers; track modifier) {
                  <span class="chip">{{ modifier }}</span>
                }
              </div>
              <p class="muted">{{ tournament.rule }}</p>
              <button class="btn" type="button" (click)="selectTournament(tournament)">Select</button>
            </article>
          }
        </div>
      </section>

      <section>
        <div class="section-head">
          <div>
            <p class="eyebrow">Strategy</p>
            <h3>Pick a strategy</h3>
          </div>
        </div>
        <div class="strategy-deck">
          @for (strategy of strategies; track strategy.id) {
            <button
              class="strategy-card"
              type="button"
              [class.strategy-card--selected]="selectedStrategyId() === strategy.id"
              (click)="selectStrategy(strategy)"
            >
              <span class="strategy-card__tag">{{ strategy.shortLabel }}</span>
              <strong>{{ strategy.label }}</strong>
              <span>{{ strategy.description }}</span>
              <span class="muted">{{ strategy.upside }}</span>
              <span class="strategy-card__risk">{{ strategy.risk }}</span>
            </button>
          }
        </div>
      </section>

      @if (running()) {
        <div class="empty tournament-loading">Running tournament…</div>
      }

      @if (current(); as run) {
        <article id="tournament-results" class="tournament-broadcast" tabindex="-1">
          <div class="broadcast-stage">
            <p class="eyebrow">{{ run.definition.sponsor }} · {{ run.strategy.label }}</p>
            <h3>Champion: {{ displayChampion(run) }}</h3>
            <p class="lead">{{ broadcastSummary(run) }}</p>
            <div class="metric-grid">
              <div class="metric"><span class="metric__label">Hype</span><strong class="metric__value">{{ run.hypeScore }}</strong></div>
              <div class="metric"><span class="metric__label">Momentum</span><strong class="metric__value">{{ run.momentum }}</strong></div>
              <div class="metric"><span class="metric__label">Crowd</span><strong class="metric__value">{{ run.crowdMood }}</strong></div>
              <div class="metric"><span class="metric__label">Prediction</span><strong class="metric__value">{{ predictionLabel(run) }}</strong></div>
            </div>
          </div>
          <div class="contender-strip" aria-label="Tournament contenders">
            @for (contender of contenderSpotlight(run); track contender.id) {
              <div class="seed-token" [class.seed-token--player]="contender.player">
                <img [src]="contender.leadImage || fallbackImage" [alt]="contender.leadName" (error)="onImageError($event)" />
                <span>{{ contender.crest }}</span>
                <strong>{{ contender.leadName }}</strong>
              </div>
            }
          </div>
        </article>

        <section class="phase-rail" aria-label="Tournament reveal phases">
          @for (phase of run.phases; track phase.round) {
            <button
              class="phase-node"
              type="button"
              [disabled]="phase.round > revealedRounds()"
              [class.phase-node--active]="phase.round <= revealedRounds()"
              [class.phase-node--shock]="phase.shock && phase.round <= revealedRounds()"
              (click)="focusPhase(phase.round)"
            >
              <span>{{ phase.label }}</span>
              <strong>{{ phase.highestHype }}</strong>
            </button>
          }
        </section>

        <article class="prediction-slip">
          <div>
            <p class="eyebrow">Your prediction</p>
            <h3>Guess the champion before the final round</h3>
            <p class="lead">{{ predictionCopy(run) }}</p>
          </div>
          <div class="prediction-grid">
            @for (contender of predictionContenders(run); track contender.id) {
              <button
                class="prediction-card"
                type="button"
                [disabled]="revealComplete()"
                [class.prediction-card--selected]="prediction()?.id === contender.id"
                [class.prediction-card--hit]="prediction()?.id === contender.id && predictionResult(run) === 'hit'"
                [class.prediction-card--miss]="prediction()?.id === contender.id && predictionResult(run) === 'miss'"
                (click)="pickPrediction(contender)"
              >
                <img [src]="contender.leadImage || fallbackImage" [alt]="contender.leadName" (error)="onImageError($event)" />
                <span>{{ contender.crest }}</span>
                <strong>{{ contender.name }}</strong>
              </button>
            }
          </div>
          @if (predictionResult(run) !== 'open' && predictionResult(run) !== 'pending') {
            <button class="btn btn--accent" type="button" [disabled]="predictionBonusClaimed()" (click)="claimPredictionBonus(run)">
              {{ predictionBonusClaimed() ? 'Prediction bonus claimed' : 'Claim prediction bonus' }}
            </button>
          }
        </article>

        <div class="split tournament-theater">
          <article class="panel moment-panel">
            <h3>Highlights</h3>
            <div class="story-feed">
              @for (moment of visibleMoments(run); track moment.id) {
                <button
                  class="story-beat moment-card"
                  type="button"
                  [class.moment-card--hot]="moment.tone === 'hot'"
                  [class.moment-card--danger]="moment.tone === 'danger'"
                  [class.moment-card--success]="moment.tone === 'success'"
                  (click)="focusMoment(moment)"
                >
                  <span class="story-beat__round">R{{ moment.round }}</span>
                  <span>
                    <strong>{{ moment.title }}</strong>
                    <span class="muted">{{ moment.detail }}</span>
                    <span class="bar"><span class="bar__head"><span>Intensity</span><strong>{{ moment.intensity }}</strong></span><span class="bar__track"><span class="bar__fill" [style.width.%]="moment.intensity"></span></span></span>
                  </span>
                </button>
              }
            </div>
          </article>

          <article class="panel final-theater">
            <p class="eyebrow">Featured match</p>
            @if (spotlightMatch(run); as match) {
              <h3>{{ match.headline }}</h3>
              <div class="match-card__teams">
                <span>{{ match.playerName }}</span>
                <strong>vs</strong>
                <span>{{ match.enemyName }}</span>
              </div>
              <div class="metric-grid">
                <div class="metric"><span class="metric__label">Winner</span><strong class="metric__value">{{ match.winnerName }}</strong></div>
                <div class="metric"><span class="metric__label">Hype</span><strong class="metric__value">{{ match.hype }}</strong></div>
                <div class="metric"><span class="metric__label">Swing</span><strong class="metric__value">{{ match.swing }}</strong></div>
                <div class="metric"><span class="metric__label">Bits</span><strong class="metric__value">{{ match.rewardBits }}</strong></div>
              </div>
              <div class="chip-row">
                @for (tag of match.dramaTags; track tag) { <span class="chip chip--hot">{{ tag }}</span> }
              </div>
              <div class="power-line">
                <span>{{ match.leftPower }}</span>
                <div class="bar__track"><div class="bar__fill" [style.width.%]="powerSplit(match)"></div></div>
                <span>{{ match.rightPower }}</span>
              </div>
              <div class="spotlight-log">
                @for (line of spotlightLog(match); track line) {
                  <p>{{ line }}</p>
                }
              </div>
            }
          </article>
        </div>

        <article class="reward-draft">
          <div>
            <p class="eyebrow">Rewards</p>
            <h3>Pick one reward</h3>
            <p class="lead">Your choice is saved to your progress and finishes the run.</p>
          </div>
          <div class="reward-grid">
            @for (reward of run.rewardOptions; track reward.id) {
              <button
                class="reward-card"
                type="button"
                [disabled]="claimedReward() !== null"
                [class.reward-card--claimed]="claimedReward()?.id === reward.id"
                (click)="claimReward(reward)"
              >
                <span class="chip">{{ reward.rarity }}</span>
                <strong>{{ reward.title }}</strong>
                <span>{{ reward.description }}</span>
                <span class="muted">+{{ reward.amount }} {{ reward.track }} mastery</span>
              </button>
            }
          </div>
        </article>

        <article class="panel bracket-board">
          <div class="section-head">
            <div>
              <p class="eyebrow">Bracket</p>
              <h3>Rounds</h3>
            </div>
            <button class="btn" type="button" [disabled]="revealComplete()" (click)="revealNext()">Reveal next round</button>
          </div>
          @for (round of roundNumbers(run); track round) {
            <p class="eyebrow">Round {{ round }}</p>
            @if (round <= revealedRounds()) {
              <div class="grid">
                @for (match of roundMatches(run, round); track match.id) {
                  <button
                    class="match-card tournament-match-card"
                    type="button"
                    [class.match-card--upset]="match.upset"
                    [class.match-card--spotlight]="spotlightMatchId() === match.id"
                    (click)="setSpotlight(match)"
                  >
                    <div class="match-card__top">
                      <span class="chip">Hype {{ match.hype }}</span>
                      @if (match.upset) { <span class="chip chip--hot">Upset</span> }
                      <span class="chip">{{ match.rewardBits }} bits</span>
                    </div>
                    <strong>{{ match.headline }}</strong>
                    <div class="match-card__teams">
                      <span>{{ match.playerName }}</span>
                      <strong>vs</strong>
                      <span>{{ match.enemyName }}</span>
                    </div>
                    <div class="power-line">
                      <span>{{ match.leftPower }}</span>
                      <div class="bar__track"><div class="bar__fill" [style.width.%]="powerSplit(match)"></div></div>
                      <span>{{ match.rightPower }}</span>
                    </div>
                    <p class="muted">Winner: {{ match.winnerName }} - Margin {{ match.margin }}</p>
                  </button>
                }
              </div>
            } @else {
              <div class="locked-round">Round {{ round }} is locked. Reveal it to see these matches.</div>
            }
          }
        </article>
      }
    </section>
  `,
})
export class TournamentsPage {
  private readonly repo = inject(DigimonRepository);
  private readonly progress = inject(GameProgressRepository);
  protected readonly fallbackImage = FALLBACK_IMAGE;
  protected readonly tournaments = TOURNAMENTS;
  protected readonly strategies = TOURNAMENT_STRATEGIES;
  protected readonly selectedTournament = signal<TournamentDefinition>(TOURNAMENTS[0]);
  protected readonly selectedStrategyId = signal<TournamentStrategyId>('balanced');
  protected readonly selectedStrategy = computed<TournamentStrategy>(
    () => this.strategies.find((strategy) => strategy.id === this.selectedStrategyId()) ?? this.strategies[0],
  );
  protected readonly current = signal<TournamentRun | null>(null);
  protected readonly running = signal(false);
  protected readonly revealedRounds = signal(0);
  protected readonly spotlightMatchId = signal<string | null>(null);
  protected readonly claimedReward = signal<TournamentRewardOption | null>(null);
  protected readonly prediction = signal<TournamentRun['contenders'][number] | null>(null);
  protected readonly predictionBonusClaimed = signal(false);
  protected readonly toast = signal('');
  protected readonly quests = signal<DigiCoreQuest[]>([]);

  constructor() {
    void this.refreshQuests();
  }

  protected onImageError(event: Event): void {
    imageError(event);
  }

  protected questCompletion(quest: DigiCoreQuest): number {
    return questCompletion(quest);
  }

  protected async claimQuest(quest: DigiCoreQuest): Promise<void> {
    await this.progress.claimQuest(quest);
    await this.refreshQuests();
  }

  protected selectTournament(tournament: TournamentDefinition): void {
    this.selectedTournament.set(tournament);
    this.toast.set(`${tournament.name} primed.`);
  }

  protected selectStrategy(strategy: TournamentStrategy): void {
    this.selectedStrategyId.set(strategy.id);
    this.toast.set(`${strategy.label} locked.`);
  }

  protected summary(run: TournamentRun): string {
    return tournamentSummary(run);
  }

  protected displayChampion(run: TournamentRun): string {
    return this.revealComplete() ? (run.championName ?? 'Unknown') : 'Signal hidden';
  }

  protected broadcastSummary(run: TournamentRun): string {
    if (this.revealComplete()) return this.summary(run);
    const phase = run.phases.find((item) => item.round === this.revealedRounds());
    return `${phase?.summary ?? 'Opening signal is live.'} Final result is hidden until the last reveal.`;
  }

  protected difficultyPips(tournament: TournamentDefinition): boolean[] {
    return Array.from({ length: 5 }, (_, index) => index < tournament.difficulty);
  }

  protected finalMatch(run: TournamentRun): TournamentMatch | null {
    return run.matches[run.matches.length - 1] ?? null;
  }

  protected contenderSpotlight(run: TournamentRun): TournamentRun['contenders'] {
    return run.contenders.slice(0, 6);
  }

  protected predictionContenders(run: TournamentRun): TournamentRun['contenders'] {
    const contenders = [run.contenders.find((contender) => contender.player), ...run.contenders.filter((contender) => !contender.player)]
      .filter((contender): contender is TournamentRun['contenders'][number] => Boolean(contender))
      .slice(0, 4);
    return contenders;
  }

  protected roundNumbers(run: TournamentRun): number[] {
    return [...new Set(run.matches.map((match) => match.round))];
  }

  protected roundMatches(run: TournamentRun, round: number): TournamentMatch[] {
    return run.matches.filter((match) => match.round === round);
  }

  protected visibleMoments(run: TournamentRun): TournamentMoment[] {
    return run.moments.filter((moment) => moment.round === 0 || moment.round <= this.revealedRounds());
  }

  protected powerSplit(match: TournamentMatch): number {
    const total = Math.max(1, match.leftPower + match.rightPower);
    return Math.round((match.leftPower / total) * 100);
  }

  protected revealComplete(): boolean {
    const run = this.current();
    return !run || this.revealedRounds() >= run.phases.length;
  }

  protected predictionLabel(run: TournamentRun): string {
    const result = this.predictionResult(run);
    if (result === 'hit') return 'hit';
    if (result === 'miss') return 'miss';
    return this.prediction()?.leadName ?? 'open';
  }

  protected predictionCopy(run: TournamentRun): string {
    const result = this.predictionResult(run);
    if (result === 'hit') return `${this.prediction()?.name} called it. Claim the mastery bonus.`;
    if (result === 'miss') return `${this.prediction()?.name} fell short. Consolation analysis is still available.`;
    if (result === 'pending') return `${this.prediction()?.name} locked. Reveal the final gate to resolve it.`;
    return `Pick from the visible power targets before the final gate. Correct calls pay extra tactics mastery.`;
  }

  protected predictionResult(run: TournamentRun): 'open' | 'pending' | 'hit' | 'miss' {
    const pick = this.prediction();
    if (!pick) return 'open';
    if (!this.revealComplete()) return 'pending';
    return pick.name === run.championName ? 'hit' : 'miss';
  }

  protected revealNext(): void {
    const run = this.current();
    if (!run) return;
    const next = Math.min(run.phases.length, this.revealedRounds() + 1);
    this.revealedRounds.set(next);
    const phase = run.phases.find((item) => item.round === next);
    const spotlight = this.roundMatches(run, next).sort((a, b) => b.hype - a.hype)[0] ?? this.finalMatch(run);
    if (spotlight) this.spotlightMatchId.set(spotlight.id);
    this.toast.set(phase?.shock ? `Shock reveal: ${phase.summary}` : `${phase?.label ?? 'Round'} revealed.`);
  }

  protected revealAll(): void {
    const run = this.current();
    if (!run) return;
    this.revealedRounds.set(run.phases.length);
    this.spotlightMatchId.set(run.spotlightMatchId);
    this.toast.set('Full broadcast unlocked.');
  }

  protected focusPhase(round: number): void {
    const run = this.current();
    if (!run || round > this.revealedRounds()) return;
    const match = this.roundMatches(run, round).sort((a, b) => b.hype - a.hype)[0];
    if (match) this.setSpotlight(match);
  }

  protected focusMoment(moment: TournamentMoment): void {
    const run = this.current();
    if (!run || !moment.matchId) return;
    const match = run.matches.find((item) => item.id === moment.matchId);
    if (match) this.setSpotlight(match);
  }

  protected setSpotlight(match: TournamentMatch): void {
    this.spotlightMatchId.set(match.id);
    this.toast.set(`Spotlight: ${match.headline}`);
  }

  protected pickPrediction(contender: TournamentRun['contenders'][number]): void {
    if (this.revealComplete()) return;
    this.prediction.set(contender);
    this.predictionBonusClaimed.set(false);
    this.toast.set(`Prediction locked: ${contender.name}.`);
  }

  protected spotlightMatch(run: TournamentRun): TournamentMatch | null {
    return run.matches.find((match) => match.id === this.spotlightMatchId()) ?? this.finalMatch(run);
  }

  protected spotlightLog(match: TournamentMatch): string[] {
    return (match.result?.events ?? []).slice(-5).map(eventText);
  }

  protected async claimReward(reward: TournamentRewardOption): Promise<void> {
    this.claimedReward.set(reward);
    await this.progress.applyMastery({
      track: reward.track,
      amount: reward.amount,
      reason: `Tournament reward: ${reward.title}`,
    });
    this.toast.set(`${reward.title} claimed.`);
  }

  protected async claimPredictionBonus(run: TournamentRun): Promise<void> {
    if (this.predictionBonusClaimed()) return;
    const result = this.predictionResult(run);
    const amount = result === 'hit' ? 14 : 5;
    await this.progress.applyMastery({
      track: result === 'hit' ? 'tactics' : 'scan',
      amount,
      reason: `Tournament prediction ${result}`,
    });
    this.predictionBonusClaimed.set(true);
    this.toast.set(result === 'hit' ? `Prediction hit: +${amount} tactics mastery.` : `Prediction miss: +${amount} scan mastery.`);
  }

  protected async run(): Promise<void> {
    const tournament = this.selectedTournament();
    this.running.set(true);
    this.claimedReward.set(null);
    this.prediction.set(null);
    this.predictionBonusClaimed.set(false);
    try {
      const [player, opponents] = await Promise.all([
        loadMany(this.repo, DEFAULT_TEAM.slice(0, tournament.teamSize)),
        loadMany(this.repo, tournament.seedIds),
      ]);
      const run = runTournament(tournament, player, opponents, this.selectedStrategyId());
      this.current.set(run);
      this.revealedRounds.set(1);
      const openingSpotlight = this.roundMatches(run, 1).sort((a, b) => b.hype - a.hype)[0] ?? this.finalMatch(run);
      this.spotlightMatchId.set(openingSpotlight?.id ?? run.spotlightMatchId);
      this.toast.set(`${run.definition.name} started with ${run.strategy.label}.`);
      setTimeout(() => {
        const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
        globalThis.document?.getElementById('tournament-results')?.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'start',
        });
      });
      await this.progress.saveTournament({
        tournamentId: tournament.id,
        name: tournament.name,
        status: run.status,
        championName: run.championName,
        run,
      });
      await this.refreshQuests();
    } finally {
      this.running.set(false);
    }
  }

  private async refreshQuests(): Promise<void> {
    this.quests.set(await this.progress.dailyQuestBoard());
  }
}
