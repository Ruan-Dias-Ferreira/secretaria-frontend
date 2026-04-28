

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
      },
      {
        path: 'matriculas',
        loadComponent: () =>
          import('./features/matriculas/components/matricula-list/matricula-list.component')
            .then(m => m.MatriculaListComponent)
      },
      {
        path: 'notas',
        loadComponent: () =>
          import('./features/notas/components/nota-list/nota-list.component')
            .then(m => m.NotaListComponent)
      },
      {
        path: 'frequencias',
        loadComponent: () =>
          import('./features/frequencias/components/frequencia-list/frequencia-list.component')
            .then(m => m.FrequenciaListComponent)
      },
      {
        path: 'documentos',
        loadComponent: () =>
          import('./features/documentos/components/documento-list/documento-list.component')
            .then(m => m.DocumentoListComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/usuarios/components/usuario-list/usuario-list.component')
            .then(m => m.UsuarioListComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];