import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Digimon, MetaEntry } from '../../core/models/digimon';
import { DigimonRepository } from '../../core/repositories/digimon-repository';
import { GameProgressRepository } from '../../core/repositories/game-progress-repository';
import { dayIndex } from '../../core/utils/seed';
import {
  createSkillForgePrograms,
  runSkillForge,
  skillComboFit,
  skillForgeWinRate,
  type SkillForgeProgram,
  type SkillForgeResult,
} from '../../game';

const FALLBACK_IMAGE = 'assets/placeholders/digimon-fallback.svg';
const DEFAULT_TEAM = [1, 2, 3];

async function loadMany(repo: DigimonRepository, ids: number[]): Promise<Digimon[]> {
  const settled = await Promise.allSettled(ids.map((id) => repo.getDigimon(id)));
  return settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
}

@Component({
  selector: 'app-skill-forge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="page forge-page">
      <header class="page-head tournament-hero forge-hero">
        <p class="eyebrow">// Skill Forge</p>
        <h2>Combo Training Dojo</h2>
        <p class="lead">Use live DAPI skill metadata to forge combo chains, train team roles and bank skill mastery.</p>
        <div class="metric-grid">
          <div class="metric"><span class="metric__label">Programs</span><strong class="metric__value">{{ programs().length }}</strong></div>
          <div class="metric"><span class="metric__label">Combo Fit</span><strong class="metric__value">{{ fit().total }}%</strong></div>
          <div class="metric"><span class="metric__label">Winrate</span><strong class="metric__value">{{ winRate() }}%</strong></div>
          <div class="metric"><span class="metric__label">History</span><strong class="metric__value">{{ history().length }}</strong></div>
        </div>
      </header>

      @if (loading()) {
        <div class="empty">Loading Skill Forge programs...</div>
      } @else if (error()) {
        <div class="empty">Skill metadata could not be loaded. Retry the Forge.</div>
      } @else if (selected(); as program) {
        <div class="forge-grid">
          @for (entry of programs(); track entry.id) {
            <button
              class="forge-card"
              type="button"
              [class.forge-card--selected]="selected()?.id === entry.id"
              [class.forge-card--high]="entry.risk === 'high'"
              (click)="select(entry)"
            >
              <span class="eyebrow">{{ entry.kind }} // {{ entry.risk }}</span>
              <strong>{{ entry.title }}</strong>
              <span>{{ entry.objective }}</span>
              <span class="chip chip--hot">{{ entry.rewardBits }} bits</span>
            </button>
          }
        </div>

        <article class="forge-theater" [class.forge-theater--perfect]="result()?.outcome === 'perfect'">
          <div class="forge-core">
            <span>{{ program.focusSkill }}</span>
            <div class="forge-core__rings" aria-hidden="true"></div>
          </div>
          <div class="forge-theater__body">
            <p class="eyebrow">{{ program.kind }} // {{ program.targetTag }}</p>
            <h3>{{ program.title }}</h3>
            <p class="lead">{{ program.objective }}</p>
            <p class="muted">Required accuracy {{ program.requiredAccuracy }}. Risk {{ program.risk }}.</p>
            <div class="chip-row">
              @for (tag of program.tags; track tag) {
                <span class="chip">{{ tag }}</span>
              }
            </div>
            <div class="action-row">
              <button class="btn btn--primary" type="button" [disabled]="running()" (click)="run()">Run forge drill</button>
              <button class="btn" type="button" [disabled]="running()" (click)="reroll()">Reroll programs</button>
              <a class="btn" routerLink="/skills">Open Skill Library</a>
            </div>
          </div>
        </article>

        <div class="split">
          <article class="panel">
            <p class="eyebrow">Combo Fit</p>
            <h3>{{ fit().total }}% chain confidence</h3>
            <div class="stat-list">
              <div class="bar"><div class="bar__head"><span>Tag Match</span><strong>{{ fit().tagMatch }}</strong></div><div class="bar__track"><div class="bar__fill" [style.width.%]="fit().tagMatch"></div></div></div>
              <div class="bar"><div class="bar__head"><span>Role Match</span><strong>{{ fit().roleMatch }}</strong></div><div class="bar__track"><div class="bar__fill" [style.width.%]="fit().roleMatch"></div></div></div>
              <div class="bar"><div class="bar__head"><span>Accuracy</span><strong>{{ fit().accuracy }}</strong></div><div class="bar__track"><div class="bar__fill" [style.width.%]="fit().accuracy"></div></div></div>
              <div class="bar"><div class="bar__head"><span>Power</span><strong>{{ fit().power }}</strong></div><div class="bar__track"><div class="bar__fill" [style.width.%]="fit().power"></div></div></div>
            </div>
            @for (note of fit().notes; track note) {
              <p class="muted">{{ note }}</p>
            }
          </article>

          <article class="panel">
            <h3>Training Team</h3>
            <div class="forge-roster">
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
          <article class="forge-result" [class.forge-result--perfect]="run.outcome === 'perfect'">
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
            <div class="split">
              <div class="story-feed">
                @for (step of run.comboChain; track step) {
                  <div class="log__line">{{ step }}</div>
                }
              </div>
              <div class="story-feed">
                @for (note of run.coaching; track note) {
                  <div class="metric"><span class="metric__label">Coach</span><strong class="metric__value">{{ note }}</strong></div>
                }
              </div>
            </div>
          </article>
        }

        <article class="panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Forge Archive</p>
              <h3>Recent combo drills</h3>
            </div>
            <a class="btn" routerLink="/collection">Open Collection</a>
          </div>
          <div class="grid">
            @for (entry of history(); track entry.id) {
              <div class="metric">
                <span class="metric__label">{{ entry.outcome }} // {{ entry.score }}</span>
                <strong class="metric__value">{{ entry.programTitle }}</strong>
                <p class="muted">{{ entry.recap }}</p>
              </div>
            } @empty {
              <p class="muted">No forge runs archived yet.</p>
            }
          </div>
        </article>
      }
    </section>
  `,
})
export class SkillForgePage {
  private readonly repo = inject(DigimonRepository);
  private readonly progress = inject(GameProgressRepository);
  protected readonly fallbackImage = FALLBACK_IMAGE;
  protected readonly skills = signal<MetaEntry[]>([]);
  protected readonly programs = signal<SkillForgeProgram[]>([]);
  protected readonly selected = signal<SkillForgeProgram | null>(null);
  protected readonly team = signal<Digimon[]>([]);
  protected readonly history = signal<Awaited<ReturnType<GameProgressRepository['listSkillForgeRuns']>>>([]);
  protected readonly result = signal<SkillForgeResult | null>(null);
  protected readonly loading = signal(true);
  protected readonly running = signal(false);
  protected readonly error = signal(false);
  protected readonly seedOffset = signal(0);
  protected readonly fit = computed(() =>
    this.selected() ? skillComboFit(this.selected()!, this.team()) : skillComboFit(createSkillForgePrograms([], 1)[0], []),
  );
  protected readonly winRate = computed(() => skillForgeWinRate(this.history()));

  constructor() {
    void this.load();
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
  }

  protected select(program: SkillForgeProgram): void {
    this.selected.set(program);
    this.result.set(null);
  }

  protected async reroll(): Promise<void> {
    this.seedOffset.update((value) => value + 41);
    await this.load();
  }

  protected async run(): Promise<void> {
    const program = this.selected();
    if (!program) return;
    this.running.set(true);
    try {
      const result = runSkillForge(program, this.team(), dayIndex() + this.seedOffset());
      this.result.set(result);
      await this.progress.saveSkillForgeRun(result);
      this.history.set(await this.progress.listSkillForgeRuns());
    } finally {
      this.running.set(false);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    this.result.set(null);
    try {
      const [skills, teams, history] = await Promise.all([
        this.repo.getMeta('skill'),
        this.progress.listTeams(),
        this.progress.listSkillForgeRuns(),
      ]);
      const ids = teams[0]?.memberIds.slice(0, 3) ?? DEFAULT_TEAM;
      const team = await loadMany(this.repo, ids);
      const programs = createSkillForgePrograms(skills, dayIndex() + this.seedOffset());
      this.skills.set(skills);
      this.team.set(team.length ? team : await loadMany(this.repo, DEFAULT_TEAM));
      this.programs.set(programs);
      this.selected.set(programs[0] ?? null);
      this.history.set(history);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
