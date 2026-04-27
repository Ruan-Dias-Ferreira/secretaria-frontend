

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/components/login/login.component')
        .then(m => m.LoginComponent)
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./shared/components/unauthorized-page/unauthorized-page.component')
        .then(m => m.UnauthorizedPageComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/components/home/home.component')
            .then(m => m.HomeComponent)
      },
      {
        path: 'alunos',
        loadComponent: () =>
          import('./features/alunos/components/aluno-list/aluno-list.component')
            .then(m => m.AlunoListComponent)
      },
      {
        path: 'turmas',
        loadComponent: () =>
          import('./features/turmas/components/turma-list/turma-list.component')
            .then(m => m.TurmaListComponent)
      },
      {
        path: 'disciplinas',
        loadComponent: () =>
          import('./features/disciplinas/components/disciplina-list/disciplina-list.component')
            .then(m => m.DisciplinaListComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];