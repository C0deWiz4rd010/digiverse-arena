import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Digimon } from '../../core/models/digimon';
import { DigimonRepository } from '../../core/repositories/digimon-repository';
import { GameProgressRepository } from '../../core/repositories/game-progress-repository';
import {
  analyzeDigiLink,
  createSquadLabPlan,
  runSquadDrill,
  squadDrillSuccessRate,
  type DigimonIdea,
  type SquadDiagnosticKey,
  type SquadDrillResult,
  type SquadMission,
} from '../../game';
import { ideasForTeam } from '../../game/campaign/campaign-content';

const FALLBACK_IMAGE = 'assets/placeholders/digimon-fallback.svg';
const DEFAULT_TEAM = [1, 2, 3];
const PRESETS = {
  balanced: [1, 2, 3],
  field: [4, 11, 21, 243],
  elite: [306, 377, 530],
} as const;

async function loadMany(repo: DigimonRepository, ids: readonly number[]): Promise<Digimon[]> {
  const settled = await Promise.allSettled(ids.map((id) => repo.getDigimon(id)));
  return settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
}

@Component({
  selector: 'app-squad-lab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="page squad-page">
      <header class="page-head tournament-hero squad-hero">
        <p class="eyebrow">// Squad Lab</p>
        <h2>Squad Lab</h2>
        <p class="lead">Build a real Arena formation, read every role, run training drills and turn team theory into saved DigiCore progress.</p>
        <div class="metric-grid">
          <div class="metric"><span class="metric__label">Squad Score</span><strong class="metric__value">{{ plan().score.total }}</strong></div>
          <div class="metric"><span class="metric__label">Lab Fit</span><strong class="metric__value">{{ plan().diagnostics.total }}</strong></div>
          <div class="metric"><span class="metric__label">Nexus</span><strong class="metric__value">{{ nexus().grade }}</strong></div>
          <div class="metric"><span class="metric__label">Drill Rate</span><strong class="metric__value">{{ drillRate() }}%</strong></div>
        </div>
      </header>

      <div class="toolbar squad-toolbar">
        <input
          class="input"
          type="number"
          min="1"
          placeholder="Digimon ID"
          [value]="addId()"
          (input)="addId.set($any($event.target).value)"
        />
        <button class="btn btn--primary" type="button" (click)="addById()">Add ID</button>
        <button class="btn" type="button" (click)="addRandom()">Add random</button>
        <button class="btn" type="button" (click)="loadPreset('balanced')">Balance Squad</button>
        <button class="btn" type="button" (click)="loadPreset('field')">Field Core</button>
        <button class="btn" type="button" (click)="loadPreset('elite')">Elite Circuit</button>
        <button class="btn btn--accent" type="button" [disabled]="members().length === 0" (click)="saveTeam()">Save team</button>
        <a class="btn" routerLink="/arena">Arena</a>
        <a class="btn" routerLink="/nexus">Nexus</a>
      </div>

      @if (message()) {
        <div class="campaign-toast" role="status">
          <strong>{{ message() }}</strong>
        </div>
      }

      <div class="split squad-layout">
        <article class="panel squad-theater">
          <div class="section-head">
            <div>
              <p class="eyebrow">Formation</p>
              <h3>{{ plan().diagnostics.formation }}</h3>
            </div>
            <span class="chip chip--hot">{{ members().length }}/6 slots</span>
          </div>
          <div class="squad-roster">
            @for (member of members(); track member.id) {
              <div class="squad-member">
                <div class="squad-member__image">
                  <img [src]="member.image || fallbackImage" [alt]="member.name" (error)="onImageError($event)" />
                </div>
                <div class="squad-member__body">
                  <p class="eyebrow">{{ roleFor(member.id)?.role }}</p>
                  <h3>{{ member.name }}</h3>
                  <div class="chip-row">
                    <span class="chip">{{ roleFor(member.id)?.attribute }}</span>
                    <span class="chip">{{ roleFor(member.id)?.field }}</span>
                    <span class="chip chip--hot">Power {{ roleFor(member.id)?.power }}</span>
                  </div>
                  <p class="muted">{{ roleFor(member.id)?.focus }}</p>
                  <p class="muted">{{ roleFor(member.id)?.risk }}</p>
                  <button class="btn" type="button" (click)="remove(member.id)">Remove</button>
                </div>
              </div>
            } @empty {
              <div class="empty">Add Digimon to wake the lab.</div>
            }
          </div>
        </article>

        <aside class="panel squad-coach">
          <p class="eyebrow">Coach Board</p>
          <h3>{{ nexus().protocol }} // Grade {{ nexus().grade }}</h3>
          <div class="metric-grid">
            <div class="metric"><span class="metric__label">Power</span><strong class="metric__value">{{ plan().score.power }}</strong></div>
            <div class="metric"><span class="metric__label">Synergy</span><strong class="metric__value">{{ plan().score.synergy }}</strong></div>
            <div class="metric"><span class="metric__label">Stress</span><strong class="metric__value">{{ plan().diagnostics.stress }}</strong></div>
          </div>
          <div class="stat-list">
            @for (entry of diagnosticEntries(); track entry.key) {
              <div class="bar">
                <div class="bar__head"><span>{{ entry.label }}</span><strong>{{ entry.value }}</strong></div>
                <div class="bar__track"><div class="bar__fill" [style.width.%]="entry.value"></div></div>
              </div>
            }
          </div>
          <div class="idea-stack">
            <p class="eyebrow">Opening Chain</p>
            @for (step of plan().diagnostics.openingChain; track step) {
              <div class="idea-mini"><strong>{{ step }}</strong><span>Relay beat locked for the next drill.</span></div>
            } @empty {
              <p class="muted">No opener yet.</p>
            }
          </div>
          <div class="idea-stack">
            <p class="eyebrow">Warnings</p>
            @for (warning of plan().diagnostics.warnings; track warning) {
              <p class="muted">{{ warning }}</p>
            }
          </div>
        </aside>
      </div>

      <section class="squad-drill-zone">
        <div class="section-head">
          <div>
            <p class="eyebrow">Training Missions</p>
            <h3>Run squad drills</h3>
          </div>
          <button class="btn btn--primary" type="button" [disabled]="members().length === 0" (click)="runSelectedDrill()">Run squad drill</button>
        </div>

        <div class="squad-mission-grid">
          @for (mission of plan().missions; track mission.id) {
            <button
              class="squad-mission"
              type="button"
              [class.squad-mission--selected]="selectedMission().id === mission.id"
              [class.squad-mission--volatile]="mission.risk === 'volatile'"
              (click)="selectedMissionId.set(mission.id)"
            >
              <span class="eyebrow">{{ mission.risk }} // difficulty {{ mission.difficulty }}</span>
              <strong>{{ mission.title }}</strong>
              <span>{{ mission.objective }}</span>
              <span class="chip-row">
                @for (tag of mission.tags; track tag) { <span class="chip">{{ tag }}</span> }
              </span>
            </button>
          }
        </div>

        <article class="squad-drill-theater">
          <div class="squad-core">
            <div class="squad-core__rings"></div>
            <span>{{ selectedMission().title }}</span>
          </div>
          <div class="squad-drill-theater__body">
            <p class="eyebrow">Active Drill</p>
            <h3>{{ selectedMission().recommendation }}</h3>
            <div class="metric-grid">
              <div class="metric"><span class="metric__label">Target</span><strong class="metric__value">{{ diagnosticLabel(selectedMission().targetAspect) }}</strong></div>
              <div class="metric"><span class="metric__label">Reward</span><strong class="metric__value">{{ selectedMission().rewardBits }}</strong></div>
              <div class="metric"><span class="metric__label">Track</span><strong class="metric__value">{{ selectedMission().masteryTrack }}</strong></div>
            </div>
          </div>
        </article>

        @if (result(); as run) {
          <article class="squad-result" [class.squad-result--flawless]="run.outcome === 'flawless'">
            <div>
              <p class="eyebrow">Outcome // {{ run.outcome }}</p>
              <h3>{{ run.recap }}</h3>
              <p class="lead">{{ run.nextHook }}</p>
            </div>
            <div class="metric-grid">
              <div class="metric"><span class="metric__label">Score</span><strong class="metric__value">{{ run.score }}</strong></div>
              <div class="metric"><span class="metric__label">Bits</span><strong class="metric__value">{{ run.rewardBits }}</strong></div>
              <div class="metric"><span class="metric__label">Mastery</span><strong class="metric__value">+{{ run.masteryAmount }}</strong></div>
            </div>
          </article>
        }
      </section>

      <div class="grid grid--wide">
        <article class="panel">
          <h3>Squad Ideas</h3>
          @for (idea of ideas().slice(0, 4); track idea.digimonId) {
            <div class="idea-mini">
              <strong>{{ idea.name }} // {{ idea.role }}</strong>
              <span>{{ idea.teamHook }}</span>
            </div>
          } @empty {
            <p class="muted">No squad ideas yet.</p>
          }
        </article>

        <article class="panel">
          <h3>Recent Squad Lab</h3>
          @for (run of history(); track run.id) {
            <p class="muted">{{ run.missionTitle }} - {{ run.outcome }} - {{ run.rewardBits }} bits - score {{ run.score }}</p>
          } @empty {
            <p class="muted">No drills archived yet.</p>
          }
        </article>
      </div>
    </section>
  `,
})
export class SquadLabPage {
  private readonly repo = inject(DigimonRepository);
  private readonly progress = inject(GameProgressRepository);
  protected readonly fallbackImage = FALLBACK_IMAGE;
  protected readonly addId = signal('1');
  protected readonly members = signal<Digimon[]>([]);
  protected readonly selectedMissionId = signal('');
  protected readonly result = signal<SquadDrillResult | null>(null);
  protected readonly message = signal('');
  protected readonly history = signal<Awaited<ReturnType<GameProgressRepository['listSquadDrillRuns']>>>([]);
  protected readonly plan = computed(() => createSquadLabPlan(this.members()));
  protected readonly nexus = computed(() => analyzeDigiLink(this.members()));
  protected readonly ideas = computed<DigimonIdea[]>(() => ideasForTeam(this.members()));
  protected readonly drillRate = computed(() => squadDrillSuccessRate(this.history()));
  protected readonly selectedMission = computed<SquadMission>(() => {
    const missions = this.plan().missions;
    return missions.find((mission) => mission.id === this.selectedMissionId()) ?? missions[0];
  });
  protected readonly diagnosticEntries = computed(() => [
    { key: 'roleBalance' as const, label: 'Role Balance', value: this.plan().diagnostics.roleBalance },
    { key: 'counterCoverage' as const, label: 'Counter Coverage', value: this.plan().diagnostics.counterCoverage },
    { key: 'fieldPlan' as const, label: 'Field Plan', value: this.plan().diagnostics.fieldPlan },
    { key: 'tempoControl' as const, label: 'Tempo Control', value: this.plan().diagnostics.tempoControl },
    { key: 'skillRelay' as const, label: 'Skill Relay', value: this.plan().diagnostics.skillRelay },
  ]);

  constructor() {
    void this.loadPreset('balanced');
    void this.refreshHistory();
  }

  protected diagnosticLabel(key: SquadDiagnosticKey): string {
    return this.diagnosticEntries().find((entry) => entry.key === key)?.label ?? key;
  }

  protected roleFor(id: number) {
    return this.plan().roles.find((role) => role.digimonId === id);
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
  }

  protected remove(id: number): void {
    this.members.update((members) => members.filter((member) => member.id !== id));
    this.result.set(null);
  }

  protected async addById(): Promise<void> {
    const id = Number(this.addId());
    if (!id || this.members().some((member) => member.id === id)) return;
    const digimon = await this.repo.getDigimon(id);
    this.members.update((members) => [...members, digimon].slice(0, 6));
    this.result.set(null);
    this.message.set(`${digimon.name} entered the lab.`);
  }

  protected async addRandom(): Promise<void> {
    const total = await this.repo.getDigimonCount();
    const page = await this.repo.getDigimonList({ page: Math.floor(Math.random() * total), pageSize: 1 });
    const pick = page.items[0];
    if (!pick || this.members().some((member) => member.id === pick.id)) return;
    const detail = await this.repo.getDigimon(pick.id);
    this.members.update((members) => [...members, detail].slice(0, 6));
    this.result.set(null);
    this.message.set(`${detail.name} joined the formation.`);
  }

  protected async loadPreset(kind: keyof typeof PRESETS): Promise<void> {
    const team = await loadMany(this.repo, PRESETS[kind] ?? DEFAULT_TEAM);
    this.members.set(team.length ? team : await loadMany(this.repo, DEFAULT_TEAM));
    this.selectedMissionId.set('');
    this.result.set(null);
    this.message.set(`${presetLabel(kind)} loaded.`);
    await this.progress.applyMastery({ track: 'tactics', amount: 5, reason: `Squad Lab ${presetLabel(kind)}` });
  }

  protected async saveTeam(): Promise<void> {
    const ids = this.members().map((member) => member.id);
    if (!ids.length) return;
    await this.progress.saveTeam({
      id: `team-${ids.join('-')}`,
      name: `${this.plan().diagnostics.formation} Squad`,
      memberIds: ids,
      score: this.plan().score.total,
    });
    this.message.set('Squad saved to Collection.');
  }

  protected async runSelectedDrill(): Promise<void> {
    if (!this.members().length) return;
    const drill = runSquadDrill(this.selectedMission(), this.members(), Date.now());
    this.result.set(drill);
    await this.progress.saveSquadDrillRun(drill);
    await this.refreshHistory();
    this.message.set(`${drill.mission.title} archived as ${drill.outcome}.`);
  }

  private async refreshHistory(): Promise<void> {
    this.history.set(await this.progress.listSquadDrillRuns());
  }
}

function presetLabel(kind: keyof typeof PRESETS): string {
  if (kind === 'field') return 'Field Core';
  if (kind === 'elite') return 'Elite Circuit';
  return 'Balance Squad';
}
