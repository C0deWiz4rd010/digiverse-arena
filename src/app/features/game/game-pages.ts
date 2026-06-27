import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { Digimon, DigimonListItem, MetaEntry } from '../../core/models/digimon';
import { primaryDescription } from '../../core/models/digimon';
import { DigimonRepository } from '../../core/repositories/digimon-repository';
import { GameProgressRepository } from '../../core/repositories/game-progress-repository';
import {
  ARENA_MODES,
  TOURNAMENTS,
  analyzeDigiLink,
  arenaIntel,
  battleSummary,
  combatTuningFromProfile,
  dataCompleteness,
  deriveSkills,
  deriveStats,
  generateNexusContracts,
  rarityScore,
  runTournament,
  scoreTeam,
  simulateBattle,
  statTotal,
  tournamentSummary,
  type ArenaModeDefinition,
  type ArenaIntel,
  type BattleEvent,
  type BattleResult,
  type DigiLinkProfile,
  type NexusContract,
  type TournamentDefinition,
  type TournamentMatch,
  type TournamentRun,
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
  selector: 'app-digidex',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="page-head">
        <p class="eyebrow">// DigiDex</p>
        <h2>Search the live DAPI roster</h2>
        <p class="lead">Fast cached list browsing with battle-ready data hooks, image fallbacks and scan mastery.</p>
      </header>

      <form class="filters" (submit)="search($event)">
        <input class="input" type="search" placeholder="Search Digimon" [value]="query()" (input)="query.set($any($event.target).value)" />
        <select class="select" [value]="level()" (change)="level.set($any($event.target).value)">
          <option value="">Any level</option>
          @for (entry of levels(); track entry.id) {
            <option [value]="entry.name">{{ entry.name }}</option>
          }
        </select>
        <select class="select" [value]="attribute()" (change)="attribute.set($any($event.target).value)">
          <option value="">Any attribute</option>
          @for (entry of attributes(); track entry.id) {
            <option [value]="entry.name">{{ entry.name }}</option>
          }
        </select>
        <label class="check"><input type="checkbox" [checked]="exact()" (change)="exact.set($any($event.target).checked)" /> Exact</label>
        <button class="btn btn--primary" type="submit">Scan</button>
      </form>

      @if (loading()) {
        <div class="empty">Loading DAPI data...</div>
      } @else if (error()) {
        <div class="empty">DAPI could not be reached. Retry the scan.</div>
      } @else {
        <div class="metric-grid">
          <div class="metric"><span class="metric__label">Results</span><strong class="metric__value">{{ total() }}</strong></div>
          <div class="metric"><span class="metric__label">Page</span><strong class="metric__value">{{ page() + 1 }}</strong></div>
          <div class="metric"><span class="metric__label">DigiCore</span><strong class="metric__value">+scan</strong></div>
        </div>
        <div class="grid">
          @for (item of items(); track item.id) {
            <article class="monster-card">
              <a class="monster-card__image" [routerLink]="['/dex', item.id]">
                <img [src]="item.image || fallbackImage" [alt]="item.name" loading="lazy" width="180" height="150" (error)="onImageError($event)" />
              </a>
              <h3 class="monster-card__title">{{ item.name }}</h3>
              <div class="chip-row"><span class="chip">#{{ item.id }}</span><span class="chip chip--hot">Battle data ready</span></div>
              <a class="btn" [routerLink]="['/dex', item.id]">Open profile</a>
            </article>
          }
        </div>
        <div class="action-row">
          <button class="btn" type="button" [disabled]="page() === 0" (click)="move(-1)">Previous</button>
          <button class="btn" type="button" [disabled]="items().length === 0" (click)="move(1)">Next</button>
        </div>
      }
    </section>
  `,
})
export class DigiDexPage {
  private readonly repo = inject(DigimonRepository);
  private readonly progress = inject(GameProgressRepository);
  protected readonly fallbackImage = FALLBACK_IMAGE;
  protected readonly query = signal('');
  protected readonly exact = signal(false);
  protected readonly level = signal('');
  protected readonly attribute = signal('');
  protected readonly page = signal(0);
  protected readonly items = signal<DigimonListItem[]>([]);
  protected readonly total = signal(0);
  protected readonly levels = signal<MetaEntry[]>([]);
  protected readonly attributes = signal<MetaEntry[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  constructor() {
    void this.bootstrap();
  }

  protected onImageError(event: Event): void {
    imageError(event);
  }

  protected search(event: Event): void {
    event.preventDefault();
    this.page.set(0);
    void this.load();
  }

  protected move(delta: number): void {
    this.page.update((page) => Math.max(0, page + delta));
    void this.load();
  }

  private async bootstrap(): Promise<void> {
    const [levels, attributes] = await Promise.all([
      this.repo.getMeta('level').catch(() => []),
      this.repo.getMeta('attribute').catch(() => []),
    ]);
    this.levels.set(levels);
    this.attributes.set(attributes);
    await this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      const page = await this.repo.getDigimonList({
        page: this.page(),
        pageSize: 24,
        name: this.query().trim() || undefined,
        exact: this.query().trim() ? this.exact() : undefined,
        level: this.level() || undefined,
        attribute: this.attribute() || undefined,
      });
      this.items.set(page.items);
      this.total.set(page.totalElements);
      await this.progress.applyMastery({ track: 'scan', amount: 2, reason: 'DigiDex scan' });
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}

@Component({
  selector: 'app-digimon-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (loading()) {
      <div class="empty">Loading Digimon profile...</div>
    } @else if (digimon(); as d) {
      <section class="page">
        <div class="detail-hero panel">
          <div class="detail-hero__image">
            <img [src]="d.image || fallbackImage" [alt]="d.name" width="220" height="220" (error)="onImageError($event)" />
          </div>
          <div>
            <p class="eyebrow">// Profile #{{ d.id }}</p>
            <h2>{{ d.name }}</h2>
            <p class="lead">{{ description(d) }}</p>
            <div class="chip-row">
              @for (level of d.levels; track level.id) { <span class="chip">{{ level.name }}</span> }
              @for (attribute of d.attributes; track attribute.id) { <span class="chip chip--hot">{{ attribute.name }}</span> }
              @if (d.xAntibody) { <span class="chip chip--hot">X-Antibody</span> }
            </div>
            <div class="action-row">
              <a class="btn btn--primary" routerLink="/arena">Start arena</a>
              <a class="btn" [routerLink]="['/compare']" [queryParams]="{ ids: d.id + ',1,2' }">Compare</a>
              <a class="btn" routerLink="/team-builder">Add via Team Builder</a>
            </div>
          </div>
        </div>

        <div class="grid grid--wide">
          <article class="panel">
            <h3>Battle Stats</h3>
            <div class="stat-list">
              @for (entry of statEntries(); track entry.label) {
                <div class="bar">
                  <div class="bar__head"><span>{{ entry.label }}</span><strong>{{ entry.value }}</strong></div>
                  <div class="bar__track"><div class="bar__fill" [style.width.%]="statPercent(entry.value)"></div></div>
                </div>
              }
            </div>
          </article>
          <article class="panel">
            <h3>Scouter</h3>
            <div class="metric-grid">
              <div class="metric"><span class="metric__label">Power</span><strong class="metric__value">{{ totalPower() }}</strong></div>
              <div class="metric"><span class="metric__label">Rarity</span><strong class="metric__value">{{ rarity() }}</strong></div>
              <div class="metric"><span class="metric__label">Data</span><strong class="metric__value">{{ completeness() }}%</strong></div>
            </div>
          </article>
          <article class="panel">
            <h3>Derived Skills</h3>
            <div class="grid">
              @for (skill of skills(); track skill.id) {
                <div class="metric">
                  <span class="metric__label">{{ skill.kind }} / {{ skill.accuracy }}%</span>
                  <strong class="metric__value">{{ skill.name }}</strong>
                  <p class="muted">Power {{ skill.power }} · CD {{ skill.cooldown }}</p>
                  <div class="chip-row">@for (tag of skill.tags; track tag) { <span class="chip">{{ tag }}</span> }</div>
                </div>
              }
            </div>
          </article>
          <article class="panel">
            <h3>Evolution Links</h3>
            <div class="chip-row">
              @for (evo of d.priorEvolutions; track evo.id) { <a class="chip" [routerLink]="['/dex', evo.id]">← {{ evo.name }}</a> }
              @for (evo of d.nextEvolutions; track evo.id) { <a class="chip chip--hot" [routerLink]="['/dex', evo.id]">{{ evo.name }} →</a> }
            </div>
          </article>
        </div>
      </section>
    } @else {
      <div class="empty">Profile not found.</div>
    }
  `,
})
export class DigimonDetailPage {
  private readonly repo = inject(DigimonRepository);
  private readonly route = inject(ActivatedRoute);
  private readonly progress = inject(GameProgressRepository);
  protected readonly fallbackImage = FALLBACK_IMAGE;
  protected readonly digimon = signal<Digimon | null>(null);
  protected readonly loading = signal(true);
  protected readonly stats = computed(() => (this.digimon() ? deriveStats(this.digimon()!) : null));
  protected readonly skills = computed(() => (this.digimon() ? deriveSkills(this.digimon()!) : []));
  protected readonly totalPower = computed(() => (this.stats() ? statTotal(this.stats()!) : 0));
  protected readonly rarity = computed(() => (this.digimon() ? rarityScore(this.digimon()!) : 0));
  protected readonly completeness = computed(() => (this.digimon() ? dataCompleteness(this.digimon()!) : 0));
  protected readonly statEntries = computed(() => {
    const stats = this.stats();
    return stats
      ? [
          { label: 'HP', value: stats.hp },
          { label: 'Attack', value: stats.attack },
          { label: 'Defense', value: stats.defense },
          { label: 'Speed', value: stats.speed },
          { label: 'Spirit', value: stats.spirit },
          { label: 'Technique', value: stats.technique },
        ]
      : [];
  });

  constructor() {
    void this.load();
  }

  protected onImageError(event: Event): void {
    imageError(event);
  }

  protected description(digimon: Digimon): string {
    return primaryDescription(digimon) ?? 'No profile text available from the DAPI yet.';
  }

  protected statPercent(value: number): number {
    return Math.min(100, Math.round((value / 180) * 100));
  }

  private async load(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading.set(true);
    try {
      const digimon = await this.repo.getDigimon(id);
      this.digimon.set(digimon);
      await this.progress.applyMastery({ track: 'scan', amount: 5, reason: `Profile ${digimon.name}` });
      if (digimon.nextEvolutions.length || digimon.priorEvolutions.length) {
        await this.progress.applyMastery({ track: 'evolution', amount: 3, reason: 'Evolution link viewed' });
      }
    } finally {
      this.loading.set(false);
    }
  }
}

@Component({
  selector: 'app-evolution-lab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="page-head">
        <p class="eyebrow">// Evolution Lab</p>
        <h2>Trace DAPI evolution links</h2>
        <p class="lead">Load a profile, inspect prior and next forms, then jump directly into profiles or compare paths.</p>
      </header>
      <form class="toolbar" (submit)="load($event)">
        <input class="input" type="number" min="1" placeholder="Digimon ID" [value]="id()" (input)="id.set($any($event.target).value)" />
        <button class="btn btn--primary" type="submit">Trace</button>
      </form>
      @if (digimon(); as d) {
        <article class="panel">
          <p class="eyebrow">Current node</p>
          <h3>{{ d.name }}</h3>
          <div class="chip-row">
            @for (level of d.levels; track level.id) { <span class="chip">{{ level.name }}</span> }
            @for (field of d.fields; track field.id) { <span class="chip chip--hot">{{ field.name }}</span> }
          </div>
        </article>
        <div class="grid grid--wide">
          <article class="panel">
            <h3>Prior Forms</h3>
            <div class="chip-row">
              @for (evo of d.priorEvolutions; track evo.id) {
                <a class="chip" [routerLink]="['/dex', evo.id]">{{ evo.name }}</a>
              } @empty {
                <span class="muted">No prior forms in this DAPI profile.</span>
              }
            </div>
          </article>
          <article class="panel">
            <h3>Next Forms</h3>
            <div class="chip-row">
              @for (evo of d.nextEvolutions; track evo.id) {
                <a class="chip chip--hot" [routerLink]="['/dex', evo.id]">{{ evo.name }}</a>
              } @empty {
                <span class="muted">No next forms in this DAPI profile.</span>
              }
            </div>
          </article>
        </div>
      }
    </section>
  `,
})
export class EvolutionLabPage {
  private readonly repo = inject(DigimonRepository);
  private readonly progress = inject(GameProgressRepository);
  protected readonly id = signal('1');
  protected readonly digimon = signal<Digimon | null>(null);

  constructor() {
    void this.load();
  }

  protected async load(event?: Event): Promise<void> {
    event?.preventDefault();
    const id = Number(this.id());
    if (!id) return;
    const digimon = await this.repo.getDigimon(id);
    this.digimon.set(digimon);
    await this.progress.applyMastery({ track: 'evolution', amount: 8, reason: `Evolution lab ${digimon.name}` });
  }
}

@Component({
  selector: 'app-field-explorer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <header class="page-head">
        <p class="eyebrow">// Field Explorer</p>
        <h2>Biome-aware battle planning</h2>
        <p class="lead">Fields become arena modifiers, team cohesion hooks and DigiCore cartography progress.</p>
      </header>
      <div class="grid">
        @for (field of fields(); track field.id) {
          <article class="panel">
            <p class="eyebrow">Field #{{ field.id }}</p>
            <h3>{{ field.name }}</h3>
            <p class="muted">Matching members receive +10% field pressure inside compatible Arena modes.</p>
            <button class="btn" type="button" (click)="explore(field.name)">Explore Field</button>
          </article>
        }
      </div>
    </section>
  `,
})
export class FieldExplorerPage {
  private readonly repo = inject(DigimonRepository);
  private readonly progress = inject(GameProgressRepository);
  protected readonly fields = signal<MetaEntry[]>([]);

  constructor() {
    void this.repo.getMeta('field').then((fields) => this.fields.set(fields));
  }

  protected explore(name: string): void {
    void this.progress.applyMastery({ track: 'field', amount: 6, reason: name });
  }
}

@Component({
  selector: 'app-skill-library',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <header class="page-head">
        <p class="eyebrow">// Skill Library</p>
        <h2>Skill metadata becomes combat language</h2>
        <p class="lead">Search DAPI skills and train the DigiCore skill track for better battle insight.</p>
      </header>
      <div class="toolbar">
        <input class="input" type="search" placeholder="Filter skills" [value]="query()" (input)="query.set($any($event.target).value)" />
        <button class="btn btn--primary" type="button" (click)="train()">Analyze visible skills</button>
      </div>
      <div class="grid">
        @for (skill of filtered(); track skill.id) {
          <article class="panel">
            <p class="eyebrow">Skill #{{ skill.id }}</p>
            <h3>{{ skill.name }}</h3>
            <div class="chip-row"><span class="chip">Power heuristic</span><span class="chip chip--hot">Taggable</span></div>
          </article>
        }
      </div>
    </section>
  `,
})
export class SkillLibraryPage {
  private readonly repo = inject(DigimonRepository);
  private readonly progress = inject(GameProgressRepository);
  protected readonly query = signal('');
  protected readonly skills = signal<MetaEntry[]>([]);
  protected readonly filtered = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.skills()
      .filter((skill) => !query || skill.name.toLowerCase().includes(query))
      .slice(0, 80);
  });

  constructor() {
    void this.repo.getMeta('skill').then((skills) => this.skills.set(skills));
  }

  protected train(): void {
    void this.progress.applyMastery({ track: 'skill', amount: 8, reason: 'Skill library analysis' });
  }
}

@Component({
  selector: 'app-team-builder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="page-head">
        <p class="eyebrow">// Team Builder</p>
        <h2>Build a scored Arena team</h2>
        <p class="lead">Teams are saved locally, scored immediately and reused by Arena, Random Battle and Tournaments.</p>
      </header>
      <div class="toolbar">
        <button class="btn btn--primary" type="button" (click)="addRandom()">Add random Digimon</button>
        <button class="btn" type="button" (click)="autoBalance()">Balance team</button>
        <button class="btn btn--accent" type="button" [disabled]="members().length === 0" (click)="save()">Save team</button>
        <a class="btn" routerLink="/arena">Open Arena</a>
        <a class="btn" routerLink="/nexus">Open Nexus Lab</a>
      </div>
      <div class="split">
        <div class="grid">
          @for (member of members(); track member.id) {
            <article class="monster-card">
              <div class="monster-card__image"><img [src]="member.image || fallbackImage" [alt]="member.name" (error)="onImageError($event)" /></div>
              <h3 class="monster-card__title">{{ member.name }}</h3>
              <div class="chip-row">@for (attribute of member.attributes; track attribute.id) { <span class="chip">{{ attribute.name }}</span> }</div>
              <button class="btn" type="button" (click)="remove(member.id)">Remove</button>
            </article>
          } @empty {
            <div class="empty">Add Digimon to start a team.</div>
          }
        </div>
        <aside class="panel">
          <h3>Team Score</h3>
          <div class="metric-grid">
            <div class="metric"><span class="metric__label">Total</span><strong class="metric__value">{{ score().total }}</strong></div>
            <div class="metric"><span class="metric__label">Power</span><strong class="metric__value">{{ score().power }}</strong></div>
            <div class="metric"><span class="metric__label">Synergy</span><strong class="metric__value">{{ score().synergy }}</strong></div>
          </div>
          <div class="stat-list">
            <div class="bar"><div class="bar__head"><span>Coverage</span><strong>{{ score().coverage }}</strong></div><div class="bar__track"><div class="bar__fill" [style.width.%]="score().coverage"></div></div></div>
            <div class="bar"><div class="bar__head"><span>Field cohesion</span><strong>{{ score().fieldCohesion }}</strong></div><div class="bar__track"><div class="bar__fill" [style.width.%]="score().fieldCohesion"></div></div></div>
            <div class="bar"><div class="bar__head"><span>Skill diversity</span><strong>{{ score().skillDiversity }}</strong></div><div class="bar__track"><div class="bar__fill" [style.width.%]="score().skillDiversity"></div></div></div>
          </div>
          @for (note of score().notes; track note) { <p class="muted">{{ note }}</p> }
          <div class="nexus-board">
            <p class="eyebrow">DigiLink Nexus</p>
            <h3>{{ nexus().protocol }} · Grade {{ nexus().grade }}</h3>
            <div class="metric-grid">
              <div class="metric"><span class="metric__label">Nexus</span><strong class="metric__value">{{ nexus().score }}</strong></div>
              <div class="metric"><span class="metric__label">Focus</span><strong class="metric__value">+{{ nexus().perks.focusStart }}</strong></div>
              <div class="metric"><span class="metric__label">Reward</span><strong class="metric__value">x{{ nexus().perks.rewardMultiplier }}</strong></div>
            </div>
            <div class="stat-list">
              @for (aspect of nexus().aspects; track aspect.id) {
                <div class="bar"><div class="bar__head"><span>{{ aspect.label }}</span><strong>{{ aspect.score }}</strong></div><div class="bar__track"><div class="bar__fill" [style.width.%]="aspect.score"></div></div></div>
              }
            </div>
            @for (contract of contracts(); track contract.id) {
              <div class="contract-mini">
                <strong>{{ contract.title }}</strong>
                <span>{{ contract.risk }} · {{ contract.track }}</span>
              </div>
            }
          </div>
        </aside>
      </div>
    </section>
  `,
})
export class TeamBuilderPage {
  private readonly repo = inject(DigimonRepository);
  private readonly progress = inject(GameProgressRepository);
  protected readonly fallbackImage = FALLBACK_IMAGE;
  protected readonly members = signal<Digimon[]>([]);
  protected readonly score = computed(() => scoreTeam(this.members()));
  protected readonly nexus = computed<DigiLinkProfile>(() => analyzeDigiLink(this.members()));
  protected readonly contracts = computed<NexusContract[]>(() => generateNexusContracts(this.nexus()));

  constructor() {
    void this.loadDefaults();
  }

  protected onImageError(event: Event): void {
    imageError(event);
  }

  protected remove(id: number): void {
    this.members.update((members) => members.filter((member) => member.id !== id));
  }

  protected async addRandom(): Promise<void> {
    const total = await this.repo.getDigimonCount();
    const page = await this.repo.getDigimonList({ page: Math.floor(Math.random() * total), pageSize: 1 });
    const pick = page.items[0];
    if (!pick || this.members().some((member) => member.id === pick.id)) return;
    const detail = await this.repo.getDigimon(pick.id);
    this.members.update((members) => [...members, detail].slice(0, 6));
  }

  protected async autoBalance(): Promise<void> {
    const ids = [1, 2, 3, 11, 21, 243];
    this.members.set((await loadMany(this.repo, ids)).slice(0, 3));
    await this.progress.applyMastery({ track: 'tactics', amount: 8, reason: 'Auto-balanced team' });
  }

  protected async save(): Promise<void> {
    const ids = this.members().map((member) => member.id);
    await this.progress.saveTeam({
      id: `team-${ids.join('-')}`,
      name: `Team ${this.members()[0]?.name ?? 'DigiVerse'}`,
      memberIds: ids,
      score: this.score().total,
    });
    await this.progress.applyMastery({ track: 'tactics', amount: 10, reason: 'Team saved' });
  }

  private async loadDefaults(): Promise<void> {
    this.members.set(await loadMany(this.repo, DEFAULT_TEAM));
  }
}

@Component({
  selector: 'app-nexus-lab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="page-head tournament-hero">
        <p class="eyebrow">// DigiLink Nexus</p>
        <h2>Protocol lab for team chemistry</h2>
        <p class="lead">Attributes, Fields, Skills and stat curves converge into protocols, contracts and combat pressure.</p>
        <div class="action-row">
          <button class="btn btn--primary" type="button" (click)="loadPreset('balanced')">Balanced Pulse</button>
          <button class="btn" type="button" (click)="loadPreset('field')">Field Core</button>
          <button class="btn" type="button" (click)="loadPreset('elite')">Elite Circuit</button>
          <a class="btn" routerLink="/arena">Test in Arena</a>
        </div>
      </header>

      <div class="split">
        <article class="panel nexus-intel">
          <p class="eyebrow">Active Protocol</p>
          <h3>{{ profile().protocol }} · Grade {{ profile().grade }}</h3>
          <p class="lead">Nexus score {{ profile().score }} creates +{{ profile().perks.focusStart }} opening focus, {{ percent(profile().perks.critBonus) }} crit pressure and x{{ profile().perks.rewardMultiplier }} reward forecast.</p>
          <div class="metric-grid">
            <div class="metric"><span class="metric__label">Damage</span><strong class="metric__value">x{{ profile().perks.damageModifier }}</strong></div>
            <div class="metric"><span class="metric__label">Guard</span><strong class="metric__value">{{ percent(profile().perks.guardChance) }}</strong></div>
            <div class="metric"><span class="metric__label">Contracts</span><strong class="metric__value">{{ contracts().length }}</strong></div>
          </div>
          <div class="stat-list">
            @for (aspect of profile().aspects; track aspect.id) {
              <div class="bar">
                <div class="bar__head"><span>{{ aspect.label }}</span><strong>{{ aspect.score }}</strong></div>
                <div class="bar__track"><div class="bar__fill" [style.width.%]="aspect.score"></div></div>
                <p class="muted">{{ aspect.detail }}</p>
              </div>
            }
          </div>
        </article>

        <aside class="panel">
          <h3>Nexus Contracts</h3>
          <div class="story-feed">
            @for (contract of contracts(); track contract.id) {
              <div class="story-beat contract-card">
                <span class="story-beat__round">{{ contract.risk }}</span>
                <div>
                  <strong>{{ contract.title }}</strong>
                  <p class="muted">{{ contract.objective }}</p>
                  <p class="muted">{{ contract.reward }}</p>
                  <button class="btn" type="button" (click)="activate(contract)">Activate</button>
                </div>
              </div>
            }
          </div>
          @if (message()) {
            <div class="metric"><span class="metric__label">Nexus Log</span><strong class="metric__value">{{ message() }}</strong></div>
          }
        </aside>
      </div>

      <section class="grid">
        @for (member of members(); track member.id) {
          <article class="monster-card">
            <div class="monster-card__image"><img [src]="member.image || fallbackImage" [alt]="member.name" (error)="onImageError($event)" /></div>
            <h3 class="monster-card__title">{{ member.name }}</h3>
            <div class="chip-row">
              @for (field of member.fields; track field.id) { <span class="chip">{{ field.name }}</span> }
              @for (attribute of member.attributes; track attribute.id) { <span class="chip chip--hot">{{ attribute.name }}</span> }
            </div>
          </article>
        }
      </section>
    </section>
  `,
})
export class NexusLabPage {
  private readonly repo = inject(DigimonRepository);
  private readonly progress = inject(GameProgressRepository);
  protected readonly fallbackImage = FALLBACK_IMAGE;
  protected readonly members = signal<Digimon[]>([]);
  protected readonly message = signal('');
  protected readonly profile = computed<DigiLinkProfile>(() => analyzeDigiLink(this.members()));
  protected readonly contracts = computed<NexusContract[]>(() => generateNexusContracts(this.profile()));

  constructor() {
    void this.loadPreset('balanced');
  }

  protected onImageError(event: Event): void {
    imageError(event);
  }

  protected percent(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  protected async loadPreset(kind: 'balanced' | 'elite' | 'field'): Promise<void> {
    const ids =
      kind === 'elite'
        ? [243, 244, 245]
        : kind === 'field'
          ? [1, 4, 11, 21]
          : [1, 2, 3];
    this.members.set((await loadMany(this.repo, ids)).slice(0, 3));
    await this.progress.applyMastery({ track: 'tactics', amount: 4, reason: `Nexus preset ${kind}` });
  }

  protected async activate(contract: NexusContract): Promise<void> {
    await this.progress.applyMastery({ track: contract.track, amount: 9, reason: contract.title });
    this.message.set(`${contract.title} activated. ${contract.progressHint}`);
  }
}

@Component({
  selector: 'app-arena',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <header class="page-head">
        <p class="eyebrow">// Arena</p>
        <h2>Local-first PvE command battles</h2>
        <p class="lead">Choose a mode, load real DAPI combatants and resolve a deterministic command battle with a readable event log.</p>
      </header>
      <div class="grid">
        @for (mode of modes; track mode.id) {
          <article class="panel arena-card">
            <p class="eyebrow">{{ mode.tier }} // {{ mode.cadence }}</p>
            <h3>{{ mode.name }}</h3>
            <p class="muted">{{ mode.description }}</p>
            <p class="muted">{{ mode.hazard }}</p>
            <div class="chip-row"><span class="chip">{{ mode.teamSize }}v{{ mode.teamSize }}</span><span class="chip">{{ mode.field || 'Neutral Field' }}</span><span class="chip chip--hot">{{ mode.reward }} bits</span></div>
            <div class="chip-row">
              @for (tag of mode.nexusTags; track tag) { <span class="chip">{{ tag }}</span> }
            </div>
            <p class="muted">{{ mode.modifier }}</p>
            <button class="btn btn--primary" type="button" (click)="start(mode)">Start battle</button>
          </article>
        }
      </div>

      @if (battle(); as result) {
        @if (intel(); as scan) {
          <article class="panel nexus-intel">
            <div>
              <p class="eyebrow">Nexus Intel // {{ scan.threat }}</p>
              <h3>{{ scan.recommendedProtocol }}</h3>
              <p class="lead">Edge {{ scan.playerEdge }} · Reward forecast {{ scan.rewardForecast }} bits</p>
            </div>
            <div class="grid">
              @for (note of scan.notes; track note) {
                <div class="metric"><span class="metric__label">Intel</span><strong class="metric__value">{{ note }}</strong></div>
              }
            </div>
          </article>
        }
        <div class="battle-stage">
          <div class="combatant">
            <h3>Your Team</h3>
            @for (unit of result.player; track unit.uid) {
              <img [src]="unit.digimon.image || fallbackImage" [alt]="unit.digimon.name" (error)="onImageError($event)" />
              <strong>{{ unit.digimon.name }}</strong>
              <div class="bar"><div class="bar__head"><span>HP</span><strong>{{ unit.hp }}/{{ unit.maxHp }}</strong></div><div class="bar__track"><div class="bar__fill" [style.width.%]="hpPercent(unit.hp, unit.maxHp)"></div></div></div>
            }
          </div>
          <div class="versus">{{ result.winner.toUpperCase() }}</div>
          <div class="combatant">
            <h3>Enemy Team</h3>
            @for (unit of result.enemy; track unit.uid) {
              <img [src]="unit.digimon.image || fallbackImage" [alt]="unit.digimon.name" (error)="onImageError($event)" />
              <strong>{{ unit.digimon.name }}</strong>
              <div class="bar"><div class="bar__head"><span>HP</span><strong>{{ unit.hp }}/{{ unit.maxHp }}</strong></div><div class="bar__track"><div class="bar__fill" [style.width.%]="hpPercent(unit.hp, unit.maxHp)"></div></div></div>
            }
          </div>
        </div>
        <article class="panel">
          <h3>{{ summary() }}</h3>
          <div class="log">
            @for (event of result.events.slice(-18); track $index) {
              <div class="log__line">{{ formatEvent(event) }}</div>
            }
          </div>
        </article>
      }
    </section>
  `,
})
export class ArenaPage {
  private readonly repo = inject(DigimonRepository);
  private readonly progress = inject(GameProgressRepository);
  protected readonly fallbackImage = FALLBACK_IMAGE;
  protected readonly modes = ARENA_MODES;
  protected readonly battle = signal<BattleResult | null>(null);
  protected readonly intel = signal<ArenaIntel | null>(null);
  protected readonly summary = computed(() => (this.battle() ? battleSummary(this.battle()!) : ''));

  protected onImageError(event: Event): void {
    imageError(event);
  }

  protected hpPercent(hp: number, max: number): number {
    return Math.max(0, Math.round((hp / max) * 100));
  }

  protected formatEvent(event: BattleEvent): string {
    return eventText(event);
  }

  protected async start(mode: ArenaModeDefinition): Promise<void> {
    const savedTeams = await this.progress.listTeams();
    const playerIds = savedTeams[0]?.memberIds.slice(0, mode.teamSize) ?? DEFAULT_TEAM.slice(0, mode.teamSize);
    const [player, enemy] = await Promise.all([
      loadMany(this.repo, playerIds),
      loadMany(this.repo, mode.opponentIds.slice(0, mode.teamSize)),
    ]);
    const scan = arenaIntel(player, enemy, mode.reward);
    const result = simulateBattle(player, enemy, {
      mode: mode.id,
      arenaField: mode.field,
      playerNexus: combatTuningFromProfile(analyzeDigiLink(player)),
      enemyNexus: combatTuningFromProfile(analyzeDigiLink(enemy)),
    });
    this.intel.set(scan);
    this.battle.set(result);
    await this.progress.saveBattle({
      mode: mode.name,
      winner: result.winner,
      playerIds: player.map((digimon) => digimon.id),
      enemyIds: enemy.map((digimon) => digimon.id),
      summary: battleSummary(result),
      events: result.events,
    });
  }
}

@Component({
  selector: 'app-random-battle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="page-head">
        <p class="eyebrow">// Random Battle</p>
        <h2>Generated matchups with stable simulation</h2>
        <p class="lead">Every roll pulls real DAPI entries, derives stats and writes battle history.</p>
      </header>
      <div class="toolbar">
        <button class="btn btn--primary" type="button" (click)="roll(1, '1v1 Random')">1v1 Random</button>
        <button class="btn" type="button" (click)="roll(3, '3v3 Chaos')">3v3 Chaos</button>
        <button class="btn" type="button" (click)="roll(2, 'Underdog Trial')">Underdog Trial</button>
      </div>
      @if (battle(); as result) {
        <article class="panel">
          <h3>{{ battleSummaryText() }}</h3>
          <div class="chip-row"><span class="chip chip--hot">{{ result.winner }}</span><span class="chip">{{ result.turns }} turns</span></div>
          <div class="log">@for (event of result.events.slice(-14); track $index) { <div class="log__line">{{ formatEvent(event) }}</div> }</div>
        </article>
      }
      <a class="btn" routerLink="/arena">Open Arena Hub</a>
    </section>
  `,
})
export class RandomBattlePage {
  private readonly repo = inject(DigimonRepository);
  private readonly progress = inject(GameProgressRepository);
  protected readonly battle = signal<BattleResult | null>(null);
  protected readonly battleSummaryText = computed(() => (this.battle() ? battleSummary(this.battle()!) : ''));

  protected formatEvent(event: BattleEvent): string {
    return eventText(event);
  }

  protected async roll(size: number, mode: string): Promise<void> {
    const ids = await this.randomIds(size * 2);
    const team = await loadMany(this.repo, ids.slice(0, size));
    const enemy = await loadMany(this.repo, ids.slice(size, size * 2));
    const result = simulateBattle(team, enemy, { mode, arenaField: null });
    this.battle.set(result);
    await this.progress.saveBattle({
      mode,
      winner: result.winner,
      playerIds: team.map((digimon) => digimon.id),
      enemyIds: enemy.map((digimon) => digimon.id),
      summary: battleSummary(result),
      events: result.events,
    });
  }

  private async randomIds(count: number): Promise<number[]> {
    const total = await this.repo.getDigimonCount();
    const pages = await Promise.all(
      Array.from({ length: count }, () =>
        this.repo.getDigimonList({ page: Math.floor(Math.random() * total), pageSize: 1 }),
      ),
    );
    return [...new Set(pages.flatMap((page) => page.items.map((item) => item.id)))].slice(0, count);
  }
}

@Component({
  selector: 'app-tournaments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <header class="page-head tournament-hero">
        <p class="eyebrow">// Tournaments</p>
        <h2>Grand Circuit Tournament Mode</h2>
        <p class="lead">Pick a themed event, scout the modifiers, launch the bracket and watch the DigiCore turn every upset, final and reward into a real tournament story.</p>
        <div class="metric-grid">
          <div class="metric"><span class="metric__label">Events</span><strong class="metric__value">{{ tournaments.length }}</strong></div>
          <div class="metric"><span class="metric__label">Formats</span><strong class="metric__value">4</strong></div>
          <div class="metric"><span class="metric__label">Max Seeds</span><strong class="metric__value">16</strong></div>
        </div>
      </header>

      <div class="grid grid--wide">
        @for (tournament of tournaments; track tournament.id) {
          <article class="bracket-card tournament-card">
            <p class="eyebrow">{{ tournament.sponsor }} // {{ tournament.format }}</p>
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
            <button class="btn btn--primary" type="button" [disabled]="running()" (click)="run(tournament)">Run bracket</button>
          </article>
        }
      </div>

      @if (running()) {
        <div class="empty">Charging tournament gates...</div>
      }

      @if (current(); as run) {
        <article id="tournament-results" class="panel tournament-showcase" tabindex="-1">
          <div>
            <p class="eyebrow">Champion: {{ run.championName }}</p>
            <h3>{{ run.definition.name }}</h3>
            <p class="lead">{{ summary(run) }}</p>
          </div>
          <div class="metric-grid">
            <div class="metric"><span class="metric__label">Hype</span><strong class="metric__value">{{ run.hypeScore }}</strong></div>
            <div class="metric"><span class="metric__label">Upsets</span><strong class="metric__value">{{ run.upsetCount }}</strong></div>
            <div class="metric"><span class="metric__label">Your Run</span><strong class="metric__value">{{ run.playerPlacement }}</strong></div>
            <div class="metric"><span class="metric__label">Reward</span><strong class="metric__value">{{ run.rewardSummary }}</strong></div>
          </div>
        </article>

        <div class="split">
          <article class="panel">
            <h3>Story Feed</h3>
            <div class="story-feed">
              @for (beat of run.storyBeats; track beat.title) {
                <div class="story-beat">
                  <span class="story-beat__round">R{{ beat.round }}</span>
                  <div>
                    <strong>{{ beat.title }}</strong>
                    <p class="muted">{{ beat.detail }}</p>
                    <div class="bar"><div class="bar__head"><span>Intensity</span><strong>{{ beat.intensity }}</strong></div><div class="bar__track"><div class="bar__fill" [style.width.%]="beat.intensity"></div></div></div>
                  </div>
                </div>
              }
            </div>
          </article>

          <article class="panel final-theater">
            <p class="eyebrow">Final Theater</p>
            <h3>Final Theater</h3>
            @if (finalMatch(run); as final) {
              <p class="lead">{{ final.headline }}</p>
              <div class="match-card__teams">
                <span>{{ final.playerName }}</span>
                <strong>vs</strong>
                <span>{{ final.enemyName }}</span>
              </div>
              <div class="metric-grid">
                <div class="metric"><span class="metric__label">Winner</span><strong class="metric__value">{{ final.winnerName }}</strong></div>
                <div class="metric"><span class="metric__label">Hype</span><strong class="metric__value">{{ final.hype }}</strong></div>
                <div class="metric"><span class="metric__label">Reward Bits</span><strong class="metric__value">{{ final.rewardBits }}</strong></div>
              </div>
            }
          </article>
        </div>

        <article class="panel">
          <h3>Bracket Board</h3>
          @for (round of roundNumbers(run); track round) {
            <p class="eyebrow">Round {{ round }}</p>
            <div class="grid">
              @for (match of roundMatches(run, round); track match.id) {
                <div class="match-card" [class.match-card--upset]="match.upset">
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
                  <p class="muted">Winner: {{ match.winnerName }} · Margin {{ match.margin }}</p>
                </div>
              }
            </div>
          }
        </article>
      }
    </section>
  `,
})
export class TournamentsPage {
  private readonly repo = inject(DigimonRepository);
  private readonly progress = inject(GameProgressRepository);
  protected readonly tournaments = TOURNAMENTS;
  protected readonly current = signal<TournamentRun | null>(null);
  protected readonly running = signal(false);

  protected summary(run: TournamentRun): string {
    return tournamentSummary(run);
  }

  protected difficultyPips(tournament: TournamentDefinition): boolean[] {
    return Array.from({ length: 5 }, (_, index) => index < tournament.difficulty);
  }

  protected finalMatch(run: TournamentRun): TournamentMatch | null {
    return run.matches[run.matches.length - 1] ?? null;
  }

  protected roundNumbers(run: TournamentRun): number[] {
    return [...new Set(run.matches.map((match) => match.round))];
  }

  protected roundMatches(run: TournamentRun, round: number): TournamentMatch[] {
    return run.matches.filter((match) => match.round === round);
  }

  protected powerSplit(match: TournamentMatch): number {
    const total = Math.max(1, match.leftPower + match.rightPower);
    return Math.round((match.leftPower / total) * 100);
  }

  protected async run(tournament: TournamentDefinition): Promise<void> {
    this.running.set(true);
    try {
      const [player, opponents] = await Promise.all([
        loadMany(this.repo, DEFAULT_TEAM.slice(0, tournament.teamSize)),
        loadMany(this.repo, tournament.seedIds),
      ]);
      const run = runTournament(tournament, player, opponents);
      this.current.set(run);
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
    } finally {
      this.running.set(false);
    }
  }
}

@Component({
  selector: 'app-compare',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="page-head">
        <p class="eyebrow">// Compare</p>
        <h2>Scouter comparison</h2>
        <p class="lead">Compare artwork, metadata, battle stats, rarity and data completeness.</p>
      </header>
      <div class="grid grid--wide">
        @for (digimon of digimon(); track digimon.id) {
          <article class="monster-card">
            <div class="monster-card__image"><img [src]="digimon.image || fallbackImage" [alt]="digimon.name" (error)="onImageError($event)" /></div>
            <h3 class="monster-card__title">{{ digimon.name }}</h3>
            <div class="metric-grid">
              <div class="metric"><span class="metric__label">Power</span><strong class="metric__value">{{ power(digimon) }}</strong></div>
              <div class="metric"><span class="metric__label">Rarity</span><strong class="metric__value">{{ rarity(digimon) }}</strong></div>
              <div class="metric"><span class="metric__label">Data</span><strong class="metric__value">{{ completeness(digimon) }}%</strong></div>
            </div>
            <a class="btn" [routerLink]="['/dex', digimon.id]">Open</a>
          </article>
        }
      </div>
    </section>
  `,
})
export class ComparePage {
  private readonly repo = inject(DigimonRepository);
  private readonly route = inject(ActivatedRoute);
  protected readonly fallbackImage = FALLBACK_IMAGE;
  protected readonly digimon = signal<Digimon[]>([]);

  constructor() {
    const ids =
      this.route.snapshot.queryParamMap
        .get('ids')
        ?.split(',')
        .map((id) => Number(id.trim()))
        .filter(Boolean) ?? [1, 2, 3];
    void loadMany(this.repo, ids.slice(0, 4)).then((digimon) => this.digimon.set(digimon));
  }

  protected onImageError(event: Event): void {
    imageError(event);
  }

  protected power(digimon: Digimon): number {
    return statTotal(deriveStats(digimon));
  }

  protected rarity(digimon: Digimon): number {
    return rarityScore(digimon);
  }

  protected completeness(digimon: Digimon): number {
    return dataCompleteness(digimon);
  }
}

@Component({
  selector: 'app-collection',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <header class="page-head">
        <p class="eyebrow">// Collection</p>
        <h2>Local command archive</h2>
        <p class="lead">Saved teams, battle history, tournament history and DigiCore Mastery stay on this device.</p>
      </header>
      <div class="metric-grid">
        @for (entry of masteryEntries(); track entry.label) {
          <div class="metric"><span class="metric__label">{{ entry.label }}</span><strong class="metric__value">{{ entry.value }}</strong></div>
        }
      </div>
      <div class="grid grid--wide">
        <article class="panel">
          <h3>Teams</h3>
          @for (team of teams(); track team.id) { <p class="muted">{{ team.name }} · {{ team.memberIds.join(', ') }} · score {{ team.score }}</p> } @empty { <p class="muted">No saved teams yet.</p> }
        </article>
        <article class="panel">
          <h3>Battles</h3>
          @for (battle of battles(); track battle.id) { <p class="muted">{{ battle.mode }} · {{ battle.winner }} · {{ battle.summary }}</p> } @empty { <p class="muted">No battles yet.</p> }
        </article>
        <article class="panel">
          <h3>Tournaments</h3>
          @for (run of tournaments(); track run.id) { <p class="muted">{{ run.name }} · champion {{ run.championName || 'pending' }}</p> } @empty { <p class="muted">No tournaments yet.</p> }
        </article>
      </div>
    </section>
  `,
})
export class CollectionPage {
  private readonly progress = inject(GameProgressRepository);
  protected readonly teams = signal<Awaited<ReturnType<GameProgressRepository['listTeams']>>>([]);
  protected readonly battles = signal<Awaited<ReturnType<GameProgressRepository['listBattles']>>>([]);
  protected readonly tournaments = signal<Awaited<ReturnType<GameProgressRepository['listTournaments']>>>([]);
  protected readonly masteryEntries = signal<{ label: string; value: number }[]>([]);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    const [teams, battles, tournaments, mastery] = await Promise.all([
      this.progress.listTeams(),
      this.progress.listBattles(),
      this.progress.listTournaments(),
      this.progress.mastery(),
    ]);
    this.teams.set(teams);
    this.battles.set(battles);
    this.tournaments.set(tournaments);
    this.masteryEntries.set(Object.entries(mastery.tracks).map(([label, value]) => ({ label, value })));
  }
}

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <header class="page-head">
        <p class="eyebrow">// Settings</p>
        <h2>Data, cache and performance controls</h2>
        <p class="lead">Reset local state without touching the source project or DAPI itself.</p>
      </header>
      <div class="grid">
        <article class="panel">
          <h3>API Cache</h3>
          <p class="muted">Clears cached Digimon details and metadata. The next screen will fetch fresh DAPI data.</p>
          <button class="btn" type="button" (click)="clearCache()">Clear API cache</button>
        </article>
        <article class="panel">
          <h3>User Data</h3>
          <p class="muted">Clears teams, battle history, tournament history, settings and DigiCore mastery.</p>
          <button class="btn btn--accent" type="button" (click)="clearUserData()">Clear local game data</button>
        </article>
      </div>
      @if (message()) { <div class="panel">{{ message() }}</div> }
    </section>
  `,
})
export class SettingsPage {
  private readonly repo = inject(DigimonRepository);
  private readonly progress = inject(GameProgressRepository);
  protected readonly message = signal('');

  protected async clearCache(): Promise<void> {
    await this.repo.clearCache();
    this.message.set('API cache cleared.');
  }

  protected async clearUserData(): Promise<void> {
    await this.progress.clearUserData();
    this.message.set('Local game data cleared.');
  }
}
