import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Digimon, MetaEntry } from '../../core/models/digimon';
import { DigimonRepository } from '../../core/repositories/digimon-repository';
import { GameProgressRepository } from '../../core/repositories/game-progress-repository';
import { dayIndex } from '../../core/utils/seed';
import {
  createFieldExpeditions,
  expeditionTeamFit,
  expeditionWinRate,
  runFieldExpedition,
  type FieldExpedition,
  type FieldExpeditionResult,
} from '../../game';

const FALLBACK_IMAGE = 'assets/placeholders/digimon-fallback.svg';
const DEFAULT_TEAM = [1, 2, 3];

async function loadMany(repo: DigimonRepository, ids: number[]): Promise<Digimon[]> {
  const settled = await Promise.allSettled(ids.map((id) => repo.getDigimon(id)));
  return settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
}

@Component({
  selector: 'app-expeditions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="page expedition-page">
      <header class="page-head tournament-hero expedition-hero">
        <p class="eyebrow">// Field Ops</p>
        <h2>Field Expedition Routes</h2>
        <p class="lead">Turn live DAPI Field metadata into route missions, team-fit reads, discoveries and local archive progress.</p>
        <div class="metric-grid">
          <div class="metric"><span class="metric__label">Routes</span><strong class="metric__value">{{ expeditions().length }}</strong></div>
          <div class="metric"><span class="metric__label">Team Fit</span><strong class="metric__value">{{ fit().total }}%</strong></div>
          <div class="metric"><span class="metric__label">Winrate</span><strong class="metric__value">{{ winRate() }}%</strong></div>
          <div class="metric"><span class="metric__label">History</span><strong class="metric__value">{{ history().length }}</strong></div>
        </div>
      </header>

      @if (loading()) {
        <div class="empty">Scanning Field routes...</div>
      } @else if (error()) {
        <div class="empty">Field metadata could not be loaded. Retry the route scan.</div>
      } @else if (selected(); as mission) {
        <div class="expedition-grid">
          @for (expedition of expeditions(); track expedition.id) {
            <button
              class="expedition-card"
              type="button"
              [class.expedition-card--selected]="selected()?.id === expedition.id"
              [class.expedition-card--volatile]="expedition.risk === 'volatile'"
              (click)="select(expedition)"
            >
              <span class="eyebrow">{{ expedition.risk }} // {{ expedition.recommendedAttribute }}</span>
              <strong>{{ expedition.title }}</strong>
              <span>{{ expedition.objective }}</span>
              <span class="chip chip--hot">{{ expedition.rewardBits }} bits</span>
            </button>
          }
        </div>

        <article class="expedition-theater" [class.expedition-theater--complete]="result()?.outcome === 'complete'">
          <div class="expedition-map">
            <span>{{ mission.fieldName }}</span>
            <div class="expedition-map__rings" aria-hidden="true"></div>
          </div>
          <div class="expedition-theater__body">
            <p class="eyebrow">{{ mission.risk }} // threat {{ mission.threat }}</p>
            <h3>{{ mission.title }}</h3>
            <p class="lead">{{ mission.hazard }}</p>
            <p class="muted">{{ mission.objective }}</p>
            <div class="chip-row">
              @for (tag of mission.tags; track tag) {
                <span class="chip">{{ tag }}</span>
              }
            </div>
            <div class="action-row">
              <button class="btn btn--primary" type="button" [disabled]="running()" (click)="run()">Run expedition</button>
              <button class="btn" type="button" [disabled]="running()" (click)="reroute()">Reroute daily map</button>
              <a class="btn" routerLink="/team-builder">Tune team</a>
            </div>
          </div>
        </article>

        <div class="split">
          <article class="panel">
            <p class="eyebrow">Team Fit</p>
            <h3>{{ fit().total }}% route confidence</h3>
            <div class="stat-list">
              <div class="bar"><div class="bar__head"><span>Field Match</span><strong>{{ fit().fieldMatch }}</strong></div><div class="bar__track"><div class="bar__fill" [style.width.%]="fit().fieldMatch"></div></div></div>
              <div class="bar"><div class="bar__head"><span>Attribute Match</span><strong>{{ fit().attributeMatch }}</strong></div><div class="bar__track"><div class="bar__fill" [style.width.%]="fit().attributeMatch"></div></div></div>
              <div class="bar"><div class="bar__head"><span>Power</span><strong>{{ fit().power }}</strong></div><div class="bar__track"><div class="bar__fill" [style.width.%]="fit().power"></div></div></div>
              <div class="bar"><div class="bar__head"><span>Data Quality</span><strong>{{ fit().dataQuality }}</strong></div><div class="bar__track"><div class="bar__fill" [style.width.%]="fit().dataQuality"></div></div></div>
            </div>
            @for (note of fit().notes; track note) {
              <p class="muted">{{ note }}</p>
            }
          </article>

          <article class="panel">
            <h3>Assigned Team</h3>
            <div class="expedition-roster">
              @for (member of team(); track member.id) {
                <a class="favorite-token" [routerLink]="['/dex', member.id]">
                  <img [src]="member.image || fallbackImage" [alt]="member.name" (error)="onImageError($event)" />
                  <span>{{ member.name }}</span>
                </a>
              }
            </div>
          </article>
        </div>

        @if (result(); as run) {
          <article class="expedition-result" [class.expedition-result--complete]="run.outcome === 'complete'">
            <div>
              <p class="eyebrow">Outcome // {{ run.outcome }}</p>
              <h3>{{ run.recap }}</h3>
              <p class="lead">{{ run.nextHook }}</p>
              <div class="chip-row">
                <span class="chip chip--hot">{{ run.rewardBits }} bits</span>
                <span class="chip">+{{ run.masteryAmount }} {{ run.masteryTrack }}</span>
                <span class="chip">Score {{ run.score }}</span>
              </div>
            </div>
            <div class="story-feed">
              @for (discovery of run.discoveries; track discovery) {
                <div class="log__line">{{ discovery }}</div>
              }
            </div>
          </article>
        }

        <article class="panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Field Archive</p>
              <h3>Recent expeditions</h3>
            </div>
            <a class="btn" routerLink="/collection">Open Collection</a>
          </div>
          <div class="grid">
            @for (entry of history(); track entry.id) {
              <div class="metric">
                <span class="metric__label">{{ entry.outcome }} // {{ entry.fieldName }}</span>
                <strong class="metric__value">{{ entry.rewardBits }} bits</strong>
                <p class="muted">{{ entry.recap }}</p>
              </div>
            } @empty {
              <p class="muted">No expedition runs archived yet.</p>
            }
          </div>
        </article>
      }
    </section>
  `,
})
export class ExpeditionsPage {
  private readonly repo = inject(DigimonRepository);
  private readonly progress = inject(GameProgressRepository);
  protected readonly fallbackImage = FALLBACK_IMAGE;
  protected readonly fields = signal<MetaEntry[]>([]);
  protected readonly expeditions = signal<FieldExpedition[]>([]);
  protected readonly selected = signal<FieldExpedition | null>(null);
  protected readonly team = signal<Digimon[]>([]);
  protected readonly history = signal<Awaited<ReturnType<GameProgressRepository['listExpeditionRuns']>>>([]);
  protected readonly result = signal<FieldExpeditionResult | null>(null);
  protected readonly loading = signal(true);
  protected readonly running = signal(false);
  protected readonly error = signal(false);
  protected readonly seedOffset = signal(0);
  protected readonly fit = computed(() =>
    this.selected() ? expeditionTeamFit(this.selected()!, this.team()) : expeditionTeamFit(createFieldExpeditions([], 1)[0], []),
  );
  protected readonly winRate = computed(() => expeditionWinRate(this.history()));

  constructor() {
    void this.load();
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
  }

  protected select(expedition: FieldExpedition): void {
    this.selected.set(expedition);
    this.result.set(null);
  }

  protected async reroute(): Promise<void> {
    this.seedOffset.update((value) => value + 29);
    await this.load();
  }

  protected async run(): Promise<void> {
    const mission = this.selected();
    if (!mission) return;
    this.running.set(true);
    try {
      const result = runFieldExpedition(mission, this.team(), dayIndex() + this.seedOffset());
      this.result.set(result);
      await this.progress.saveExpeditionRun(result);
      this.history.set(await this.progress.listExpeditionRuns());
    } finally {
      this.running.set(false);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    this.result.set(null);
    try {
      const [fields, teams, history] = await Promise.all([
        this.repo.getMeta('field'),
        this.progress.listTeams(),
        this.progress.listExpeditionRuns(),
      ]);
      const ids = teams[0]?.memberIds.slice(0, 3) ?? DEFAULT_TEAM;
      const team = await loadMany(this.repo, ids);
      const expeditions = createFieldExpeditions(fields, dayIndex() + this.seedOffset());
      this.fields.set(fields);
      this.team.set(team.length ? team : await loadMany(this.repo, DEFAULT_TEAM));
      this.expeditions.set(expeditions);
      this.selected.set(expeditions[0] ?? null);
      this.history.set(history);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
