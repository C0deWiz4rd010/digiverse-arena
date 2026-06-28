import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
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
    path: 'skills',
    loadComponent: () => import('./features/game/game-pages').then((m) => m.SkillLibraryPage),
  },
  {
    path: 'team-builder',
    loadComponent: () => import('./features/game/game-pages').then((m) => m.TeamBuilderPage),
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
    loadComponent: () => import('./features/game/game-pages').then((m) => m.ComparePage),
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
