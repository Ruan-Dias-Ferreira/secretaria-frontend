import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { Role } from './core/models/enums/role.enum';

export const routes: Routes = [
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
    loadComponent: () =>
      import('./shared/components/main-layout/main-layout.component')
        .then(m => m.MainLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/components/home/home.component')
            .then(m => m.HomeComponent)
      },
      {
        path: 'alunos',
        canActivate: [roleGuard],
        data: { roles: [Role.SECRETARIA, Role.PROFESSOR] },
        loadComponent: () =>
          import('./features/alunos/components/aluno-list/aluno-list.component')
            .then(m => m.AlunoListComponent)
      },
      {
        path: 'turmas',
        canActivate: [roleGuard],
        data: { roles: [Role.SECRETARIA] },
        loadComponent: () =>
          import('./features/turmas/components/turma-list/turma-list.component')
            .then(m => m.TurmaListComponent)
      },
      {
        path: 'disciplinas',
        canActivate: [roleGuard],
        data: { roles: [Role.SECRETARIA, Role.PROFESSOR] },
        loadComponent: () =>
          import('./features/disciplinas/components/disciplina-list/disciplina-list.component')
            .then(m => m.DisciplinaListComponent)
      },
      {
        path: 'matriculas',
        canActivate: [roleGuard],
        data: { roles: [Role.SECRETARIA] },
        loadComponent: () =>
          import('./features/matriculas/components/matricula-list/matricula-list.component')
            .then(m => m.MatriculaListComponent)
      },
      {
        path: 'notas',
        canActivate: [roleGuard],
        data: { roles: [Role.SECRETARIA, Role.PROFESSOR] },
        loadComponent: () =>
          import('./features/notas/components/nota-list/nota-list.component')
            .then(m => m.NotaListComponent)
      },
      {
        path: 'frequencias',
        canActivate: [roleGuard],
        data: { roles: [Role.SECRETARIA, Role.PROFESSOR] },
        loadComponent: () =>
          import('./features/frequencias/components/frequencia-list/frequencia-list.component')
            .then(m => m.FrequenciaListComponent)
      },
      {
        path: 'documentos',
        canActivate: [roleGuard],
        data: { roles: [Role.SECRETARIA] },
        loadComponent: () =>
          import('./features/documentos/components/documento-list/documento-list.component')
            .then(m => m.DocumentoListComponent)
      },
      {
        path: 'usuarios',
        canActivate: [roleGuard],
        data: { roles: [Role.SECRETARIA] },
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
