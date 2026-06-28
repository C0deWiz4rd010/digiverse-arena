import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameProgressRepository } from '../../core/repositories/game-progress-repository';
import { questCompletion, type DigiCoreQuest } from '../../game';

const FALLBACK_IMAGE = 'assets/placeholders/digimon-fallback.svg';

@Component({
  selector: 'app-collection',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="page-head">
        <p class="eyebrow">// Collection</p>
        <h2>Local command archive</h2>
        <p class="lead">Favorites, notes, teams, battle history, tournaments, field expeditions, rival bounties, mini-games and DigiCore Mastery stay on this device.</p>
      </header>

      <div class="metric-grid">
        @for (entry of masteryEntries(); track entry.label) {
          <div class="metric"><span class="metric__label">{{ entry.label }}</span><strong class="metric__value">{{ entry.value }}</strong></div>
        }
      </div>

      <div class="quest-strip">
        @for (quest of quests(); track quest.id) {
          <article class="quest-card" [class.quest-card--ready]="quest.status === 'claimable'" [class.quest-card--claimed]="quest.status === 'claimed'">
            <div class="quest-card__top"><span>{{ quest.track }}</span><strong>{{ completion(quest) }}%</strong></div>
            <h3>{{ quest.title }}</h3>
            <p class="muted">{{ quest.description }}</p>
            <div class="campaign-progress"><span [style.width.%]="completion(quest)"></span></div>
            <button class="btn" type="button" [disabled]="quest.status !== 'claimable'" (click)="claim(quest)">
              {{ quest.status === 'claimed' ? 'Claimed' : 'Claim reward' }}
            </button>
          </article>
        } @empty {
          <div class="empty">No daily quests loaded yet.</div>
        }
      </div>

      <div class="grid grid--wide">
        <article class="panel">
          <h3>Favorites</h3>
          <div class="favorite-list">
            @for (favorite of favorites(); track favorite.id) {
              <a class="favorite-token" [routerLink]="['/dex', favorite.id]">
                <img [src]="favorite.image || fallbackImage" [alt]="favorite.name" (error)="onImageError($event)" />
                <span>{{ favorite.name }}</span>
              </a>
            } @empty {
              <p class="muted">No favorites yet.</p>
            }
          </div>
        </article>

        <article class="panel">
          <h3>Notes</h3>
          @for (note of notes(); track note.digimonId) {
            <p class="muted">#{{ note.digimonId }} - {{ note.text }}</p>
          } @empty {
            <p class="muted">No notes yet.</p>
          }
        </article>

        <article class="panel">
          <h3>Teams</h3>
          @for (team of teams(); track team.id) {
            <p class="muted">{{ team.name }} - {{ team.memberIds.join(', ') }} - score {{ team.score }}</p>
          } @empty {
            <p class="muted">No saved teams yet.</p>
          }
        </article>

        <article class="panel">
          <h3>Battles</h3>
          @for (battle of battles(); track battle.id) {
            <p class="muted">{{ battle.mode }} - {{ battle.winner }} - {{ battle.summary }}</p>
          } @empty {
            <p class="muted">No battles yet.</p>
          }
        </article>

        <article class="panel">
          <h3>Tournaments</h3>
          @for (run of tournaments(); track run.id) {
            <p class="muted">{{ run.name }} - champion {{ run.championName || 'pending' }}</p>
          } @empty {
            <p class="muted">No tournaments yet.</p>
          }
        </article>

        <article class="panel">
          <h3>Rival Bounties</h3>
          @for (run of rivalRuns(); track run.id) {
            <p class="muted">{{ run.rivalName }} - {{ run.outcome }} - {{ run.rewardBits }} bits - {{ run.counterAttribute }}</p>
          } @empty {
            <p class="muted">No rival bounties yet.</p>
          }
          <a class="btn" routerLink="/rivals">Open Rival Signal</a>
        </article>

        <article class="panel">
          <h3>Field Expeditions</h3>
          @for (run of expeditionRuns(); track run.id) {
            <p class="muted">{{ run.fieldName }} - {{ run.outcome }} - {{ run.rewardBits }} bits - score {{ run.score }}</p>
          } @empty {
            <p class="muted">No field expeditions yet.</p>
          }
          <a class="btn" routerLink="/expeditions">Open Field Ops</a>
        </article>

        <article class="panel">
          <h3>Mini-Games</h3>
          @for (run of miniGameRuns(); track run.id) {
            <p class="muted">{{ run.gameId }} - {{ run.result }} - {{ run.rewardBits }} bits</p>
          } @empty {
            <p class="muted">No mini-game runs yet.</p>
          }
          <a class="btn" routerLink="/minigames">Open Arcade</a>
        </article>
      </div>
    </section>
  `,
})
export class CollectionPage {
  private readonly progress = inject(GameProgressRepository);
  protected readonly fallbackImage = FALLBACK_IMAGE;
  protected readonly favorites = signal<Awaited<ReturnType<GameProgressRepository['listFavorites']>>>([]);
  protected readonly notes = signal<Awaited<ReturnType<GameProgressRepository['listNotes']>>>([]);
  protected readonly teams = signal<Awaited<ReturnType<GameProgressRepository['listTeams']>>>([]);
  protected readonly battles = signal<Awaited<ReturnType<GameProgressRepository['listBattles']>>>([]);
  protected readonly tournaments = signal<Awaited<ReturnType<GameProgressRepository['listTournaments']>>>([]);
  protected readonly rivalRuns = signal<Awaited<ReturnType<GameProgressRepository['listRivalRuns']>>>([]);
  protected readonly expeditionRuns = signal<Awaited<ReturnType<GameProgressRepository['listExpeditionRuns']>>>([]);
  protected readonly miniGameRuns = signal<Awaited<ReturnType<GameProgressRepository['listMiniGameRuns']>>>([]);
  protected readonly quests = signal<DigiCoreQuest[]>([]);
  protected readonly masteryEntries = signal<{ label: string; value: number }[]>([]);

  constructor() {
    void this.load();
  }

  protected completion(quest: DigiCoreQuest): number {
    return questCompletion(quest);
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
  }

  protected async claim(quest: DigiCoreQuest): Promise<void> {
    await this.progress.claimQuest(quest);
    await this.load();
  }

  private async load(): Promise<void> {
    const [favorites, notes, teams, battles, tournaments, rivalRuns, expeditionRuns, miniGameRuns, quests, mastery] = await Promise.all([
      this.progress.listFavorites(),
      this.progress.listNotes(),
      this.progress.listTeams(),
      this.progress.listBattles(),
      this.progress.listTournaments(),
      this.progress.listRivalRuns(),
      this.progress.listExpeditionRuns(),
      this.progress.listMiniGameRuns(),
      this.progress.dailyQuestBoard(),
      this.progress.mastery(),
    ]);
    this.favorites.set(favorites);
    this.notes.set(notes);
    this.teams.set(teams);
    this.battles.set(battles);
    this.tournaments.set(tournaments);
    this.rivalRuns.set(rivalRuns);
    this.expeditionRuns.set(expeditionRuns);
    this.miniGameRuns.set(miniGameRuns);
    this.quests.set(quests);
    this.masteryEntries.set(Object.entries(mastery.tracks).map(([label, value]) => ({ label, value })));
  }
}
