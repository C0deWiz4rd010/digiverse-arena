import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { Digimon } from '../../core/models/digimon';
import { DigimonRepository } from '../../core/repositories/digimon-repository';
import { GameProgressRepository } from '../../core/repositories/game-progress-repository';
import {
  createScouterDuelPlan,
  createScouterScenarios,
  resolveScouterDuel,
  scouterHitRate,
  type ScouterCandidate,
  type ScouterDuelResult,
  type ScouterScenario,
} from '../../game';

const FALLBACK_IMAGE = 'assets/placeholders/digimon-fallback.svg';
const DEFAULT_IDS = [1, 2, 3];
const PRESETS = {
  starters: [1, 2, 3],
  rivals: [4, 7, 13, 22],
  mega: [306, 377, 530, 987],
} as const;

async function loadMany(repo: DigimonRepository, ids: readonly number[]): Promise<Digimon[]> {
  const settled = await Promise.allSettled(ids.map((id) => repo.getDigimon(id)));
  return settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
}

@Component({
  selector: 'app-scouter-duel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="page scouter-page">
      <header class="page-head tournament-hero scouter-hero">
        <p class="eyebrow">// Compare</p>
        <h2>Scouter Duel</h2>
        <p class="lead">Call the winner before the simulation speaks. Read stats, attributes, fields and skill hooks, then archive the prediction.</p>
        <div class="metric-grid">
          <div class="metric"><span class="metric__label">Candidates</span><strong class="metric__value">{{ members().length }}</strong></div>
          <div class="metric"><span class="metric__label">Confidence</span><strong class="metric__value">{{ plan().confidence }}</strong></div>
          <div class="metric"><span class="metric__label">Hit Rate</span><strong class="metric__value">{{ hitRate() }}%</strong></div>
          <div class="metric"><span class="metric__label">History</span><strong class="metric__value">{{ history().length }}</strong></div>
        </div>
      </header>

      <div class="toolbar scouter-toolbar">
        <input class="input" type="number" min="1" placeholder="Digimon ID" [value]="addId()" (input)="addId.set($any($event.target).value)" />
        <button class="btn btn--primary" type="button" (click)="addById()">Add ID</button>
        <button class="btn" type="button" (click)="addRandom()">Add random</button>
        <button class="btn" type="button" (click)="loadPreset('starters')">Starter Set</button>
        <button class="btn" type="button" (click)="loadPreset('rivals')">Rival Set</button>
        <button class="btn" type="button" (click)="loadPreset('mega')">Mega Set</button>
        <a class="btn" routerLink="/team-builder">Squad Lab</a>
        <a class="btn" routerLink="/arena">Arena</a>
      </div>

      @if (message()) {
        <div class="campaign-toast" role="status"><strong>{{ message() }}</strong></div>
      }

      <div class="scouter-scenario-grid">
        @for (scenario of scenarios; track scenario.id) {
          <button
            class="scouter-scenario"
            type="button"
            [class.scouter-scenario--selected]="selectedScenario().id === scenario.id"
            [class.scouter-scenario--volatile]="scenario.risk === 'volatile'"
            (click)="selectedScenarioId.set(scenario.id); result.set(null)"
          >
            <span class="eyebrow">{{ scenario.risk }} // difficulty {{ scenario.difficulty }}</span>
            <strong>{{ scenario.title }}</strong>
            <span>{{ scenario.objective }}</span>
            <span class="chip-row">
              @for (tag of scenario.tags; track tag) { <span class="chip">{{ tag }}</span> }
            </span>
          </button>
        }
      </div>

      <article class="scouter-theater">
        <div class="scouter-core">
          <div class="scouter-core__rings"></div>
          <span>{{ selectedScenario().title }}</span>
        </div>
        <div class="scouter-theater__body">
          <p class="eyebrow">Scouter Read</p>
          <h3>{{ plan().notes[0] }}</h3>
          <p class="lead">{{ plan().notes[1] }}</p>
          <div class="metric-grid">
            <div class="metric"><span class="metric__label">Margin</span><strong class="metric__value">{{ plan().margin }}</strong></div>
            <div class="metric"><span class="metric__label">Spread</span><strong class="metric__value">{{ plan().spread }}</strong></div>
            <div class="metric"><span class="metric__label">Reward</span><strong class="metric__value">{{ selectedScenario().rewardBits }}</strong></div>
          </div>
        </div>
      </article>

      <div class="scouter-candidate-grid">
        @for (candidate of plan().candidates; track candidate.digimonId) {
          <article class="scouter-card" [class.scouter-card--leader]="candidate.digimonId === plan().winnerId">
            <div class="scouter-card__image">
              <img [src]="imageFor(candidate.digimonId)" [alt]="candidate.name" (error)="onImageError($event)" />
            </div>
            <div class="scouter-card__body">
              <p class="eyebrow">{{ candidate.role }} // {{ candidate.winOdds }}%</p>
              <h3>{{ candidate.name }}</h3>
              <div class="chip-row">
                <span class="chip">{{ candidate.attribute }}</span>
                <span class="chip">{{ candidate.field }}</span>
                <span class="chip chip--hot">{{ candidate.skillHook }}</span>
              </div>
              <div class="stat-list">
                @for (entry of candidateBars(candidate); track entry.label) {
                  <div class="bar">
                    <div class="bar__head"><span>{{ entry.label }}</span><strong>{{ entry.value }}</strong></div>
                    <div class="bar__track"><div class="bar__fill" [style.width.%]="entry.value"></div></div>
                  </div>
                }
              </div>
              @for (note of candidate.notes; track note) { <p class="muted">{{ note }}</p> }
              <button class="btn btn--primary" type="button" (click)="predict(candidate.digimonId)">Call {{ candidate.name }}</button>
            </div>
          </article>
        } @empty {
          <div class="empty">Load Digimon to start a Scouter Duel.</div>
        }
      </div>

      @if (result(); as run) {
        <article class="scouter-result" [class.scouter-result--hit]="run.outcome !== 'miss'">
          <div>
            <p class="eyebrow">Outcome // {{ run.outcome }}</p>
            <h3>{{ run.recap }}</h3>
            <p class="lead">{{ run.nextHook }}</p>
            <div class="action-row">
              @if (run.winnerId) { <a class="btn btn--primary" [routerLink]="['/dex', run.winnerId]">Open winner</a> }
              <a class="btn" routerLink="/team-builder">Tune in Squad Lab</a>
              <a class="btn" routerLink="/arena">Test in Arena</a>
            </div>
          </div>
          <div class="metric-grid">
            <div class="metric"><span class="metric__label">Winner</span><strong class="metric__value">{{ run.winnerName }}</strong></div>
            <div class="metric"><span class="metric__label">Prediction</span><strong class="metric__value">{{ run.predictedName }}</strong></div>
            <div class="metric"><span class="metric__label">Confidence</span><strong class="metric__value">{{ run.confidence }}</strong></div>
            <div class="metric"><span class="metric__label">Bits</span><strong class="metric__value">{{ run.rewardBits }}</strong></div>
          </div>
        </article>
      }

      <div class="grid grid--wide">
        <article class="panel">
          <h3>Recent Scouter Duels</h3>
          @for (run of history(); track run.id) {
            <p class="muted">{{ run.scenarioTitle }} - {{ run.outcome }} - {{ run.predictedName }} vs winner {{ run.winnerName }}</p>
          } @empty {
            <p class="muted">No Scouter Duel reads archived yet.</p>
          }
        </article>
        <article class="panel">
          <h3>Coach Notes</h3>
          @for (note of plan().notes; track note) { <p class="muted">{{ note }}</p> }
        </article>
      </div>
    </section>
  `,
})
export class ScouterDuelPage {
  private readonly repo = inject(DigimonRepository);
  private readonly progress = inject(GameProgressRepository);
  private readonly route = inject(ActivatedRoute);
  protected readonly fallbackImage = FALLBACK_IMAGE;
  protected readonly addId = signal('1');
  protected readonly members = signal<Digimon[]>([]);
  protected readonly selectedScenarioId = signal('');
  protected readonly result = signal<ScouterDuelResult | null>(null);
  protected readonly message = signal('');
  protected readonly history = signal<Awaited<ReturnType<GameProgressRepository['listScouterDuelRuns']>>>([]);
  protected readonly scenarios = createScouterScenarios();
  protected readonly selectedScenario = computed<ScouterScenario>(() => {
    return this.scenarios.find((scenario) => scenario.id === this.selectedScenarioId()) ?? this.scenarios[0];
  });
  protected readonly plan = computed(() => createScouterDuelPlan(this.members(), this.selectedScenario()));
  protected readonly hitRate = computed(() => scouterHitRate(this.history()));

  constructor() {
    void this.loadInitial();
    void this.refreshHistory();
  }

  protected candidateBars(candidate: ScouterCandidate): { label: string; value: number }[] {
    return [
      { label: 'Scenario', value: candidate.scenarioScore },
      { label: 'Power', value: candidate.power },
      { label: 'Tempo', value: candidate.tempo },
      { label: 'Skill', value: candidate.skillScore },
      { label: 'Data', value: candidate.dataQuality },
    ];
  }

  protected imageFor(id: number): string {
    return this.members().find((digimon) => digimon.id === id)?.image ?? FALLBACK_IMAGE;
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
  }

  protected async addById(): Promise<void> {
    const id = Number(this.addId());
    if (!id || this.members().some((digimon) => digimon.id === id)) return;
    const digimon = await this.repo.getDigimon(id);
    this.members.update((members) => [...members, digimon].slice(0, 4));
    this.result.set(null);
    this.message.set(`${digimon.name} entered the Scouter Duel.`);
  }

  protected async addRandom(): Promise<void> {
    const total = await this.repo.getDigimonCount();
    const page = await this.repo.getDigimonList({ page: Math.floor(Math.random() * total), pageSize: 1 });
    const pick = page.items[0];
    if (!pick || this.members().some((digimon) => digimon.id === pick.id)) return;
    const detail = await this.repo.getDigimon(pick.id);
    this.members.update((members) => [...members, detail].slice(0, 4));
    this.result.set(null);
    this.message.set(`${detail.name} joined the read.`);
  }

  protected async loadPreset(kind: keyof typeof PRESETS): Promise<void> {
    this.members.set(await loadMany(this.repo, PRESETS[kind]));
    this.result.set(null);
    this.message.set(`${presetLabel(kind)} loaded.`);
    await this.progress.applyMastery({ track: 'tactics', amount: 4, reason: `Scouter preset ${presetLabel(kind)}` });
  }

  protected async predict(id: number): Promise<void> {
    const duel = resolveScouterDuel(this.members(), this.selectedScenario(), id, Date.now());
    this.result.set(duel);
    await this.progress.saveScouterDuelRun(duel);
    await this.refreshHistory();
    this.message.set(`${duel.scenario.title} archived as ${duel.outcome}.`);
  }

  private async loadInitial(): Promise<void> {
    const ids =
      this.route.snapshot.queryParamMap
        .get('ids')
        ?.split(',')
        .map((id) => Number(id.trim()))
        .filter(Boolean)
        .slice(0, 4) ?? DEFAULT_IDS;
    this.members.set(await loadMany(this.repo, ids.length ? ids : DEFAULT_IDS));
  }

  private async refreshHistory(): Promise<void> {
    this.history.set(await this.progress.listScouterDuelRuns());
  }
}

function presetLabel(kind: keyof typeof PRESETS): string {
  if (kind === 'mega') return 'Mega Set';
  if (kind === 'rivals') return 'Rival Set';
  return 'Starter Set';
}
