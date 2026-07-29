import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { Digimon, DigimonListItem, MetaEntry } from '../../core/models/digimon';
import { primaryDescription } from '../../core/models/digimon';
import { DigimonRepository } from '../../core/repositories/digimon-repository';
import { GameProgressRepository } from '../../core/repositories/game-progress-repository';
import {
  ARENA_MODES,
  analyzeDigiLink,
  arenaIntel,
  battleSummary,
  combatTuningFromProfile,
  dataCompleteness,
  dailyEncounters,
  deriveSkills,
  deriveStats,
  generateNexusContracts,
  ideaForDigimon,
  questCompletion,
  rarityScore,
  simulateBattle,
  statTotal,
  type ArenaModeDefinition,
  type ArenaIntel,
  type BattleEvent,
  type BattleResult,
  type DigiLinkProfile,
  type DigiCoreQuest,
  type DigimonIdea,
  type EncounterDefinition,
  type NexusContract,
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
        <p class="eyebrow">DigiDex</p>
        <h2>Browse every Digimon</h2>
        <p class="lead">Search by name and filter by level or attribute. Tap a card to see full details.</p>
      </header>

      <form class="filters" (submit)="search($event)">
        <input class="input" type="search" placeholder="Search by name" [value]="query()" (input)="query.set($any($event.target).value)" />
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
        <label class="check"><input type="checkbox" [checked]="exact()" (change)="exact.set($any($event.target).checked)" /> Exact match</label>
        <button class="btn btn--primary" type="submit">Search</button>
      </form>

      @if (loading()) {
        <div class="empty">Loading Digimon…</div>
      } @else if (error()) {
        <div class="empty">Could not load data. Please try again.</div>
      } @else {
        <p class="muted">{{ total() }} Digimon found · page {{ page() + 1 }}</p>
        <div class="grid">
          @for (item of items(); track item.id) {
            <article class="monster-card">
              <a class="monster-card__image" [routerLink]="['/dex', item.id]">
                <img [src]="item.image || fallbackImage" [alt]="item.name" loading="lazy" width="180" height="150" (error)="onImageError($event)" />
              </a>
              <h3 class="monster-card__title">{{ item.name }}</h3>
              <div class="chip-row"><span class="chip">#{{ item.id }}</span></div>
              <a class="btn" [routerLink]="['/dex', item.id]">View details</a>
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
            <p class="eyebrow">#{{ d.id }}</p>
            <h2>{{ d.name }}</h2>
            <p class="lead">{{ description(d) }}</p>
            <div class="chip-row">
              @for (level of d.levels; track level.id) { <span class="chip">{{ level.name }}</span> }
              @for (attribute of d.attributes; track attribute.id) { <span class="chip chip--hot">{{ attribute.name }}</span> }
              @if (d.xAntibody) { <span class="chip chip--hot">X-Antibody</span> }
            </div>
            <div class="action-row">
              <button class="btn btn--primary" type="button" (click)="toggleFavorite(d)">
                {{ favorite() ? '★ Favorited' : '☆ Favorite' }}
              </button>
              <a class="btn" [routerLink]="['/compare']" [queryParams]="{ ids: d.id + ',1,2' }">Compare</a>
              <a class="btn" routerLink="/team-builder">Add to team</a>
            </div>
          </div>
        </div>

        @if (idea(); as idea) {
          <article class="panel idea-card idea-card--wide">
            <p class="eyebrow">Build tips</p>
            <h3>How to play {{ idea.name }}</h3>
            <div class="grid">
              <div class="metric"><span class="metric__label">Playstyle</span><strong class="metric__value">{{ idea.buildHint }}</strong></div>
              <div class="metric"><span class="metric__label">Team role</span><strong class="metric__value">{{ idea.teamHook }}</strong></div>
              <div class="metric"><span class="metric__label">Best field</span><strong class="metric__value">{{ idea.fieldHook }}</strong></div>
              <div class="metric"><span class="metric__label">Strong against</span><strong class="metric__value">{{ idea.rivalHook }}</strong></div>
            </div>
            <p class="lead">{{ idea.signatureMoment }}</p>
          </article>
        }

        <div class="grid grid--wide">
          <article class="panel">
            <h3>Stats</h3>
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
            <h3>Overview</h3>
            <div class="metric-grid">
              <div class="metric"><span class="metric__label">Power</span><strong class="metric__value">{{ totalPower() }}</strong></div>
              <div class="metric"><span class="metric__label">Rarity</span><strong class="metric__value">{{ rarity() }}</strong></div>
              <div class="metric"><span class="metric__label">Data complete</span><strong class="metric__value">{{ completeness() }}%</strong></div>
            </div>
          </article>
          <article class="panel">
            <h3>Your notes</h3>
            <textarea
              class="note-box"
              maxlength="800"
              placeholder="Add a build idea, a reminder or anything you like…"
              [value]="note()"
              (input)="note.set($any($event.target).value)"
            ></textarea>
            <div class="action-row">
              <button class="btn btn--primary" type="button" (click)="saveNote(d)">Save note</button>
              @if (noteMessage()) { <span class="muted">{{ noteMessage() }}</span> }
            </div>
          </article>
          <article class="panel">
            <h3>Skills</h3>
            <div class="grid">
              @for (skill of skills(); track skill.id) {
                <div class="metric">
                  <span class="metric__label">{{ skill.kind }} / {{ skill.accuracy }}%</span>
                  <strong class="metric__value">{{ skill.name }}</strong>
                  <p class="muted">Power {{ skill.power }} · Cooldown {{ skill.cooldown }}</p>
                  <div class="chip-row">@for (tag of skill.tags; track tag) { <span class="chip">{{ tag }}</span> }</div>
                </div>
              }
            </div>
          </article>
          <article class="panel">
            <h3>Evolutions</h3>
            <div class="chip-row">
              @for (evo of d.priorEvolutions; track evo.id) { <a class="chip" [routerLink]="['/dex', evo.id]">← {{ evo.name }}</a> }
              @for (evo of d.nextEvolutions; track evo.id) { <a class="chip chip--hot" [routerLink]="['/dex', evo.id]">{{ evo.name }} →</a> }
              @if (!d.priorEvolutions.length && !d.nextEvolutions.length) {
                <span class="muted">No evolutions listed for this Digimon.</span>
              }
            </div>
          </article>
        </div>
      </section>
    } @else {
      <div class="empty">Digimon not found.</div>
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
  protected readonly favorite = signal(false);
  protected readonly note = signal('');
  protected readonly noteMessage = signal('');
  protected readonly stats = computed(() => (this.digimon() ? deriveStats(this.digimon()!) : null));
  protected readonly skills = computed(() => (this.digimon() ? deriveSkills(this.digimon()!) : []));
  protected readonly idea = computed<DigimonIdea | null>(() => (this.digimon() ? ideaForDigimon(this.digimon()!) : null));
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

  protected async toggleFavorite(digimon: Digimon): Promise<void> {
    this.favorite.set(await this.progress.toggleFavorite({ id: digimon.id, name: digimon.name, image: digimon.image }));
  }

  protected async saveNote(digimon: Digimon): Promise<void> {
    await this.progress.saveNote(digimon.id, this.note());
    this.noteMessage.set(this.note().trim() ? 'Note saved to Collection.' : 'Note cleared.');
  }

  private async load(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading.set(true);
    try {
      const digimon = await this.repo.getDigimon(id);
      this.digimon.set(digimon);
      const [favorite, note] = await Promise.all([this.progress.isFavorite(id), this.progress.getNote(id)]);
      this.favorite.set(favorite);
      this.note.set(note);
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
        <p class="eyebrow">Evolutions</p>
        <h2>See evolution paths</h2>
        <p class="lead">Enter a Digimon ID to see which forms come before and after it.</p>
      </header>
      <form class="toolbar" (submit)="load($event)">
        <input class="input" type="number" min="1" placeholder="Digimon ID (e.g. 1)" [value]="id()" (input)="id.set($any($event.target).value)" />
        <button class="btn btn--primary" type="submit">Show</button>
      </form>
      @if (digimon(); as d) {
        <article class="panel">
          <p class="eyebrow">Selected Digimon</p>
          <h3>{{ d.name }}</h3>
          <div class="chip-row">
            @for (level of d.levels; track level.id) { <span class="chip">{{ level.name }}</span> }
            @for (field of d.fields; track field.id) { <span class="chip chip--hot">{{ field.name }}</span> }
          </div>
        </article>
        @if (idea(); as idea) {
          <article class="panel idea-card">
            <p class="eyebrow">Tip</p>
            <h3>{{ idea.signatureMoment }}</h3>
            <p class="lead">{{ idea.buildHint }}</p>
            <div class="chip-row"><span class="chip">{{ idea.role }}</span></div>
          </article>
        }
        <div class="grid grid--wide">
          <article class="panel">
            <h3>Prior Forms</h3>
            <div class="chip-row">
              @for (evo of d.priorEvolutions; track evo.id) {
                <a class="chip" [routerLink]="['/dex', evo.id]">{{ evo.name }}</a>
              } @empty {
                <span class="muted">No earlier forms listed.</span>
              }
            </div>
          </article>
          <article class="panel">
            <h3>Next Forms</h3>
            <div class="chip-row">
              @for (evo of d.nextEvolutions; track evo.id) {
                <a class="chip chip--hot" [routerLink]="['/dex', evo.id]">{{ evo.name }}</a>
              } @empty {
                <span class="muted">No later forms listed.</span>
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
  protected readonly idea = computed<DigimonIdea | null>(() => (this.digimon() ? ideaForDigimon(this.digimon()!) : null));

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
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="page-head">
        <p class="eyebrow">Fields</p>
        <h2>Battle fields &amp; bonuses</h2>
        <p class="lead">Each Digimon belongs to a field. On a matching field it gets a small battle bonus.</p>
        <div class="action-row">
          <a class="btn btn--primary" routerLink="/expeditions">Go to Expeditions</a>
        </div>
      </header>
      <div class="encounter-strip">
        @for (encounter of encounters(); track encounter.id) {
          <article class="encounter-card" [class.encounter-card--volatile]="encounter.risk === 'volatile'">
            <p class="eyebrow">{{ encounter.trigger }}</p>
            <h3>{{ encounter.headline }}</h3>
            <p class="muted">{{ encounter.detail }}</p>
            <button class="btn" type="button" (click)="explore(encounter.headline)">Explore</button>
          </article>
        }
      </div>
      <div class="grid">
        @for (field of fields(); track field.id) {
          <article class="panel">
            <p class="eyebrow">Field #{{ field.id }}</p>
            <h3>{{ field.name }}</h3>
            <p class="muted">Digimon that belong to this field get a small bonus in matching battles.</p>
            <button class="btn" type="button" (click)="explore(field.name)">Mark explored</button>
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
  protected readonly encounters = signal<EncounterDefinition[]>(dailyEncounters());

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
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="page-head">
        <p class="eyebrow">Skills</p>
        <h2>Browse all skills</h2>
        <p class="lead">Search the full list of skills. Want to try skill combos? Open Skill Training.</p>
      </header>
      <div class="toolbar">
        <input class="input" type="search" placeholder="Search skills" [value]="query()" (input)="query.set($any($event.target).value)" />
        <a class="btn btn--primary" routerLink="/skill-forge">Open Skill Training</a>
      </div>
      <div class="grid">
        @for (skill of filtered(); track skill.id) {
          <article class="panel">
            <p class="eyebrow">Skill #{{ skill.id }}</p>
            <h3>{{ skill.name }}</h3>
          </article>
        }
      </div>
    </section>
  `,
})
export class SkillLibraryPage {
  private readonly repo = inject(DigimonRepository);
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
}

@Component({
  selector: 'app-nexus-lab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="page-head tournament-hero">
        <p class="eyebrow">Synergy</p>
        <h2>How well your team works together</h2>
        <p class="lead">See your team's synergy grade and take on optional challenges to make it stronger.</p>
        <div class="action-row">
          <button class="btn btn--primary" type="button" (click)="loadPreset('balanced')">Balanced</button>
          <button class="btn" type="button" (click)="loadPreset('field')">Field</button>
          <button class="btn" type="button" (click)="loadPreset('elite')">Elite</button>
          <a class="btn" routerLink="/arena">Test in Arena</a>
        </div>
      </header>

      <div class="split">
        <article class="panel nexus-intel">
          <p class="eyebrow">Team synergy</p>
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
          <h3>Challenges</h3>
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
            <div class="metric"><span class="metric__label">Latest</span><strong class="metric__value">{{ message() }}</strong></div>
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
        <p class="eyebrow">Arena</p>
        <h2>Battle against the computer</h2>
        <p class="lead">Pick a mode below and your saved team fights automatically. Watch the result play out.</p>
      </header>
      <div class="quest-strip">
        @for (quest of quests().slice(0, 3); track quest.id) {
          <article class="quest-card" [class.quest-card--ready]="quest.status === 'claimable'">
            <div class="quest-card__top"><span>{{ quest.track }}</span><strong>{{ questCompletion(quest) }}%</strong></div>
            <h3>{{ quest.title }}</h3>
            <p class="muted">{{ quest.objectives[0].description }}</p>
            <div class="campaign-progress"><span [style.width.%]="questCompletion(quest)"></span></div>
          </article>
        }
      </div>
      <div class="grid">
        @for (mode of modes; track mode.id) {
          <article class="panel arena-card">
            <p class="eyebrow">{{ mode.tier }}</p>
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
              <p class="eyebrow">Battle preview</p>
              <h3>{{ scan.recommendedProtocol }}</h3>
              <p class="lead">Edge {{ scan.playerEdge }} · Reward forecast {{ scan.rewardForecast }} bits</p>
            </div>
            <div class="grid">
              @for (note of scan.notes; track note) {
                <div class="metric"><span class="metric__label">Tip</span><strong class="metric__value">{{ note }}</strong></div>
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
  protected readonly quests = signal<DigiCoreQuest[]>([]);
  protected readonly summary = computed(() => (this.battle() ? battleSummary(this.battle()!) : ''));

  constructor() {
    void this.refreshQuests();
  }

  protected onImageError(event: Event): void {
    imageError(event);
  }

  protected hpPercent(hp: number, max: number): number {
    return Math.max(0, Math.round((hp / max) * 100));
  }

  protected formatEvent(event: BattleEvent): string {
    return eventText(event);
  }

  protected questCompletion(quest: DigiCoreQuest): number {
    return questCompletion(quest);
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
    await this.refreshQuests();
  }

  private async refreshQuests(): Promise<void> {
    this.quests.set(await this.progress.dailyQuestBoard());
  }
}

@Component({
  selector: 'app-random-battle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="page-head">
        <p class="eyebrow">Quick Battle</p>
        <h2>Instant random battles</h2>
        <p class="lead">Roll a random matchup and watch it play out. Great for a fast fight.</p>
      </header>
      <div class="toolbar">
        <button class="btn btn--primary" type="button" (click)="roll(1, '1v1 Random')">1v1</button>
        <button class="btn" type="button" (click)="roll(3, '3v3 Chaos')">3v3</button>
        <button class="btn" type="button" (click)="roll(2, 'Underdog Trial')">Underdog</button>
      </div>
      @if (battle(); as result) {
        <article class="panel">
          <h3>{{ battleSummaryText() }}</h3>
          <div class="chip-row"><span class="chip chip--hot">{{ result.winner }}</span><span class="chip">{{ result.turns }} turns</span></div>
          <div class="log">@for (event of result.events.slice(-14); track $index) { <div class="log__line">{{ formatEvent(event) }}</div> }</div>
        </article>
      }
      <a class="btn" routerLink="/arena">Go to Arena</a>
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
