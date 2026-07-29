import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DigimonRepository } from '../../core/repositories/digimon-repository';
import type { MetaEntry } from '../../core/models/digimon';

type SkillTag = 'damage' | 'elemental' | 'support' | 'control' | 'finisher';

interface TagInfo {
  id: SkillTag;
  label: string;
  icon: string;
}

const TAGS: TagInfo[] = [
  { id: 'damage', label: 'Damage', icon: '⚔️' },
  { id: 'elemental', label: 'Elemental', icon: '🔥' },
  { id: 'support', label: 'Support', icon: '🛡️' },
  { id: 'control', label: 'Control', icon: '🕸️' },
  { id: 'finisher', label: 'Finisher', icon: '💥' },
];

const TAG_MAP = new Map<SkillTag, TagInfo>(TAGS.map((tag) => [tag.id, tag]));

const FINISHER = /ultimate|final|omega|giga|tera|terra|infinity|genocide|apocalyp|death|end of|world end|last/i;
const SUPPORT = /heal|cure|recover|regen|guard|shield|barrier|protect|boost|aura|bless|repair|restore/i;
const CONTROL = /bind|stun|freeze|sleep|seal|paralyz|slow|trap|web|chain|hold|lock|silence|confuse/i;
const ELEMENTAL = /fire|flame|blaze|burn|ice|frost|blizzard|thunder|bolt|volt|spark|storm|aqua|water|wind|gale|earth|quake|holy|light|dark|shadow|nature|leaf|poison|metal|crystal/i;

function classify(name: string): SkillTag {
  if (FINISHER.test(name)) return 'finisher';
  if (SUPPORT.test(name)) return 'support';
  if (CONTROL.test(name)) return 'control';
  if (ELEMENTAL.test(name)) return 'elemental';
  return 'damage';
}

interface TaggedSkill {
  id: number;
  name: string;
  tag: TagInfo;
}

@Component({
  selector: 'app-skill-library',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="page-head">
        <p class="eyebrow">Skills</p>
        <h2>Skill Library</h2>
        <p class="lead">
          Browse every skill, filtered by combat role. Want to build combos? Open Skill Training.
        </p>
      </header>

      <div class="toolbar">
        <input
          class="input"
          type="search"
          placeholder="Search skills"
          [value]="query()"
          (input)="query.set($any($event.target).value)"
        />
        <a class="btn btn--primary" routerLink="/skill-forge">Open Skill Training</a>
      </div>

      <div class="chip-row skill-filters">
        <button
          type="button"
          class="chip"
          [class.chip--hot]="activeTag() === null"
          (click)="activeTag.set(null)"
        >
          All ({{ skills().length }})
        </button>
        @for (tag of tags; track tag.id) {
          <button
            type="button"
            class="chip"
            [class.chip--hot]="activeTag() === tag.id"
            (click)="toggleTag(tag.id)"
          >
            {{ tag.icon }} {{ tag.label }} ({{ tagCount(tag.id) }})
          </button>
        }
      </div>

      @if (skills().length === 0) {
        <p class="muted">Loading skills…</p>
      } @else {
        <p class="muted skill-count">{{ filtered().length }} skills match</p>
        <div class="grid">
          @for (skill of visible(); track skill.id) {
            <article class="panel skill-card">
              <span class="skill-card__tag">{{ skill.tag.icon }} {{ skill.tag.label }}</span>
              <h3 class="skill-card__name">{{ skill.name }}</h3>
              <span class="skill-card__id">#{{ skill.id }}</span>
            </article>
          }
        </div>
        @if (visible().length < filtered().length) {
          <button type="button" class="btn skill-more" (click)="loadMore()">
            Load more ({{ filtered().length - visible().length }} left)
          </button>
        }
      }
    </section>
  `,
  styles: `
    .skill-filters {
      margin-top: calc(var(--space-2) * -1);
    }
    .skill-filters .chip {
      cursor: pointer;
    }
    .skill-count {
      margin: 0;
      font-size: var(--text-xs);
    }
    .skill-card {
      display: grid;
      gap: var(--space-2);
      align-content: start;
    }
    .skill-card__tag {
      font-family: var(--font-mono);
      font-size: var(--text-2xs);
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--color-primary-400);
    }
    .skill-card__name {
      margin: 0;
      font-size: var(--text-sm);
      word-break: break-word;
    }
    .skill-card__id {
      font-family: var(--font-mono);
      font-size: var(--text-2xs);
      color: var(--text-soft);
    }
    .skill-more {
      justify-self: center;
      cursor: pointer;
    }
  `,
})
export class SkillLibraryPage {
  private readonly repo = inject(DigimonRepository);

  protected readonly tags = TAGS;
  protected readonly query = signal('');
  protected readonly activeTag = signal<SkillTag | null>(null);
  protected readonly limit = signal(60);
  protected readonly skills = signal<TaggedSkill[]>([]);

  protected readonly filtered = computed(() => {
    const query = this.query().trim().toLowerCase();
    const tag = this.activeTag();
    return this.skills().filter(
      (skill) =>
        (!query || skill.name.toLowerCase().includes(query)) && (!tag || skill.tag.id === tag),
    );
  });

  protected readonly visible = computed(() => this.filtered().slice(0, this.limit()));

  constructor() {
    void this.repo.getMeta('skill').then((skills) => {
      this.skills.set(
        skills.map((skill: MetaEntry) => ({
          id: skill.id,
          name: skill.name,
          tag: TAG_MAP.get(classify(skill.name))!,
        })),
      );
    });
  }

  protected tagCount(tag: SkillTag): number {
    return this.skills().filter((skill) => skill.tag.id === tag).length;
  }

  protected toggleTag(tag: SkillTag): void {
    this.activeTag.update((current) => (current === tag ? null : tag));
    this.limit.set(60);
  }

  protected loadMore(): void {
    this.limit.update((value) => value + 60);
  }
}
