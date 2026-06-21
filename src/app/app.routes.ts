import { Routes } from '@angular/router';

const placeholder = (title: string) => ({
  loadComponent: () => import('./features/placeholder/coming-soon').then((m) => m.ComingSoon),
  data: { title },
});

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  { path: 'dex', ...placeholder('DigiDex') },
  { path: 'dex/:id', ...placeholder('Digimon Detail') },
  { path: 'evolution-lab', ...placeholder('Evolution Lab') },
  { path: 'fields', ...placeholder('Field Explorer') },
  { path: 'skills', ...placeholder('Skill Library') },
  { path: 'team-builder', ...placeholder('Team Builder') },
  { path: 'arena', ...placeholder('Arena') },
  { path: 'arena/battle', ...placeholder('Battle Simulator') },
  { path: 'random-battle', ...placeholder('Random Battle') },
  { path: 'tournaments', ...placeholder('Tournaments') },
  { path: 'compare', ...placeholder('Compare Digimon') },
  { path: 'collection', ...placeholder('Collection') },
  { path: 'settings', ...placeholder('Settings') },
  { path: '**', redirectTo: '' },
];
