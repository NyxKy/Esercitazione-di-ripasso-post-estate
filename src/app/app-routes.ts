import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/animals', pathMatch: 'full' },
  { path: 'animals', loadComponent: () => import('./pages.component').then(m => m.AnimalsComponent), title: 'Animali | EmojiCorp' },
  { path: 'fruits', loadComponent: () => import('./pages.component').then(m => m.FruitsComponent), title: 'Frutta | EmojiCorp' },
  { path: 'generic/:id', loadComponent: () => import('./pages.component').then(m => m.GenericComponent), title: 'Esplora | EmojiCorp' },
  { path: '**', redirectTo: '/animals' },
];
