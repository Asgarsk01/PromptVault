import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(
        (m) => m.LoginComponent
      )
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/prompt-list/prompt-list.component').then(
        (m) => m.PromptListComponent
      )
  },
  {
    path: 'bookmarks',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/prompt-list/prompt-list.component').then(
        (m) => m.PromptListComponent
      )
  },
  {
    path: 'dashboard/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/prompt-form/prompt-form.component').then(
        (m) => m.PromptFormComponent
      )
  },
  {
    path: 'dashboard/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/prompt-detail/prompt-detail.component').then(
        (m) => m.PromptDetailComponent
      )
  }
];
