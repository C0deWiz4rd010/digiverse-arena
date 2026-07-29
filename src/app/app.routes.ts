import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'welcome',
    loadComponent: () => import('./features/onboarding/onboarding').then((m) => m.OnboardingPage),
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile').then((m) => m.ProfilePage),
  },
  {
    path: 'achievements',
    loadComponent: () => import('./features/profile/achievements').then((m) => m.AchievementsPage),
  },
  { path: 'dex', loadComponent: () => import('./features/game/game-pages').then((m) => m.DigiDexPage) },
  {
    path: 'dex/:id',
    loadComponent: () => import('./features/game/game-pages').then((m) => m.DigimonDetailPage),
  },
  {
    path: 'evolution-lab',
    loadComponent: () => import('./features/game/game-pages').then((m) => m.EvolutionLabPage),
  },
  {
    path: 'fields',
    loadComponent: () => import('./features/game/game-pages').then((m) => m.FieldExplorerPage),
  },
  {
    path: 'expeditions',
    loadComponent: () => import('./features/game/expeditions-page').then((m) => m.ExpeditionsPage),
  },
  {
    path: 'skills',
    loadComponent: () => import('./features/game/game-pages').then((m) => m.SkillLibraryPage),
  },
  {
    path: 'skill-forge',
    loadComponent: () => import('./features/game/skill-forge-page').then((m) => m.SkillForgePage),
  },
  {
    path: 'team-builder',
    loadComponent: () => import('./features/game/squad-lab-page').then((m) => m.SquadLabPage),
  },
  {
    path: 'nexus',
    loadComponent: () => import('./features/game/game-pages').then((m) => m.NexusLabPage),
  },
  { path: 'arena', loadComponent: () => import('./features/game/game-pages').then((m) => m.ArenaPage) },
  {
    path: 'arena/battle',
    loadComponent: () => import('./features/game/game-pages').then((m) => m.ArenaPage),
  },
  {
    path: 'random-battle',
    loadComponent: () => import('./features/game/game-pages').then((m) => m.RandomBattlePage),
  },
  {
    path: 'rivals',
    loadComponent: () => import('./features/game/rivals-page').then((m) => m.RivalsPage),
  },
  {
    path: 'minigames',
    loadComponent: () => import('./features/game/minigames-page').then((m) => m.MiniGamesPage),
  },
  {
    path: 'tournaments',
    loadComponent: () => import('./features/game/tournaments-page').then((m) => m.TournamentsPage),
  },
  {
    path: 'compare',
    loadComponent: () => import('./features/game/scouter-duel-page').then((m) => m.ScouterDuelPage),
  },
  {
    path: 'collection',
    loadComponent: () => import('./features/game/collection-page').then((m) => m.CollectionPage),
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/game/game-pages').then((m) => m.SettingsPage),
  },
  { path: '**', redirectTo: '' },
];
