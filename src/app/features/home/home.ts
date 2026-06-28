import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { DigimonListItem } from '../../core/models/digimon';
import { DigimonRepository } from '../../core/repositories/digimon-repository';
import { GameProgressRepository } from '../../core/repositories/game-progress-repository';
import { dayIndex, seededIndex } from '../../core/utils/seed';
import { DigiButton } from '../../design-system/components/digi-button';
import { DigiCard } from '../../design-system/components/digi-card';
import { DigiErrorState } from '../../design-system/components/digi-error-state';
import { DigiSkeleton } from '../../design-system/components/digi-skeleton';
import {
  campaignNextAction,
  dailyEncounters,
  questCompletion,
  type DigiCoreQuest,
  type EncounterDefinition,
} from '../../game';

interface QuickAction {
  label: string;
  icon: string;
  action: () => void;
}

interface StatTile {
  label: string;
  value: number | null;
}

const FALLBACK_IMAGE = 'assets/placeholders/digimon-fallback.svg';

/** Home / Dashboard: campaign command bridge with search, quests, encounters and daily signals. */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DigiButton, DigiCard, DigiSkeleton, DigiErrorState],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly repo = inject(DigimonRepository);
  private readonly progress = inject(GameProgressRepository);
  private readonly router = inject(Router);

  protected readonly query = signal('');
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly daily = signal<DigimonListItem | null>(null);
  protected readonly dailySkill = signal<string | null>(null);
  protected readonly stats = signal<StatTile[]>([]);
  protected readonly quests = signal<DigiCoreQuest[]>([]);
  protected readonly encounters = signal<EncounterDefinition[]>([]);
  protected readonly nextAction = computed(() => campaignNextAction(this.quests()));
  protected readonly fallbackImage = FALLBACK_IMAGE;

  protected readonly quickActions: QuickAction[] = [
    { label: 'Open DigiDex', icon: 'DX', action: () => this.go('/dex') },
    { label: 'Random Digimon', icon: 'RD', action: () => void this.randomDigimon() },
    { label: 'Random Battle', icon: 'RB', action: () => this.go('/random-battle') },
    { label: 'Rival Signal', icon: 'RV', action: () => this.go('/rivals') },
    { label: 'Build Team', icon: 'TM', action: () => this.go('/team-builder') },
    { label: 'Mini-Games', icon: 'MG', action: () => this.go('/minigames') },
    { label: 'Nexus Lab', icon: 'NX', action: () => this.go('/nexus') },
  ];

  constructor() {
    void this.load();
  }

  protected onSearch(event: Event): void {
    event.preventDefault();
    const term = this.query().trim();
    void this.router.navigate(['/dex'], term ? { queryParams: { q: term } } : {});
  }

  protected go(path: string): void {
    void this.router.navigate([path]);
  }

  protected openDaily(): void {
    const d = this.daily();
    if (d) void this.router.navigate(['/dex', d.id]);
  }

  protected questCompletion(quest: DigiCoreQuest): number {
    return questCompletion(quest);
  }

  protected async claim(quest: DigiCoreQuest): Promise<void> {
    await this.progress.claimQuest(quest);
    this.quests.set(await this.progress.dailyQuestBoard());
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
  }

  protected async randomDigimon(): Promise<void> {
    try {
      const total = await this.repo.getDigimonCount();
      const page = Math.floor(Math.random() * total);
      const result = await this.repo.getDigimonList({ page, pageSize: 1 });
      const pick = result.items[0];
      if (pick) void this.router.navigate(['/dex', pick.id]);
    } catch {
      this.go('/dex');
    }
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      const [total, attributes, fields, types, levels, skills, questBoard] = await Promise.all([
        this.repo.getDigimonCount(),
        this.repo.getMetaCount('attribute'),
        this.repo.getMetaCount('field'),
        this.repo.getMetaCount('type'),
        this.repo.getMetaCount('level'),
        this.repo.getMetaCount('skill'),
        this.progress.dailyQuestBoard().catch(() => []),
      ]);

      this.stats.set([
        { label: 'Digimon', value: total },
        { label: 'Attributes', value: attributes },
        { label: 'Fields', value: fields },
        { label: 'Types', value: types },
        { label: 'Levels', value: levels },
        { label: 'Skills', value: skills },
      ]);

      const seed = dayIndex();
      this.quests.set(questBoard);
      this.encounters.set(dailyEncounters(seed));
      const dailyIdx = seededIndex(seed, total);
      const dailyPage = await this.repo.getDigimonList({ page: dailyIdx, pageSize: 1 });
      this.daily.set(dailyPage.items[0] ?? null);

      const skillList = await this.repo.getMeta('skill');
      if (skillList.length) {
        this.dailySkill.set(skillList[seededIndex(seed + 7, skillList.length)].name);
      }

      this.loading.set(false);
    } catch {
      this.error.set(true);
      this.loading.set(false);
    }
  }
}
