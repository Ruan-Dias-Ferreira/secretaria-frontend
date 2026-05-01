import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { Role } from './core/models/enums/role.enum';

const sec  = { canActivate: [roleGuard], data: { roles: [Role.SECRETARIA] } };
const both = { canActivate: [roleGuard], data: { roles: [Role.SECRETARIA, Role.PROFESSOR] } };

const placeholder = (title: string) => ({
  data: { title },
  loadComponent: () =>
    import('./shared/ui/placeholder-page/placeholder-page.component')
      .then(m => m.PlaceholderPageComponent),
});

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'home', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./shared/ui/unauthorized-page/unauthorized-page.component')
        .then(m => m.UnauthorizedPageComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/ui/main-layout/main-layout.component')
        .then(m => m.MainLayoutComponent),
    children: [

      // ── Dashboard ────────────────────────────────────────────────────
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/home/home.component')
            .then(m => m.HomeComponent),
      },

      // ── Alunos ──────────────────────────────────────────────────────
      {
        path: 'alunos', ...both,
        loadComponent: () =>
          import('./features/alunos/pages/aluno-list/aluno-list.component')
            .then(m => m.AlunoListComponent),
      },
      {
        path: 'alunos/novo', ...sec,
        loadComponent: () =>
          import('./features/alunos/pages/aluno-form-page/aluno-form-page.component')
            .then(m => m.AlunoFormPageComponent),
      },
      {
        path: 'alunos/:id/editar', ...sec,
        loadComponent: () =>
          import('./features/alunos/pages/aluno-form-page/aluno-form-page.component')
            .then(m => m.AlunoFormPageComponent),
      },
      {
        path: 'alunos/:id/perfil', ...both,
        loadComponent: () =>
          import('./features/alunos/pages/aluno-perfil/aluno-perfil.component')
            .then(m => m.AlunoPerfilComponent),
      },

      // ── Matrículas ──────────────────────────────────────────────────
      { path: 'matriculas', redirectTo: 'matriculas/nova', pathMatch: 'full' },
      {
        path: 'matriculas/nova', ...sec,
        loadComponent: () =>
          import('./features/matriculas/pages/matricula-form/matricula-form.component')
            .then(m => m.MatriculaFormComponent),
      },
      {
        path: 'matriculas/consultar', ...sec,
        loadComponent: () =>
          import('./features/matriculas/pages/matricula-list/matricula-list.component')
            .then(m => m.MatriculaListComponent),
      },
      {
        path: 'matriculas/rematricula', ...sec,
        loadComponent: () =>
          import('./features/matriculas/pages/matricula-rematricula/matricula-rematricula.component')
            .then(m => m.MatriculaRematriculaComponent),
      },
      {
        path: 'matriculas/rematricula/atualizar/:id', ...sec,
        loadComponent: () =>
          import('./features/matriculas/pages/matricula-atualizar-dados/matricula-atualizar-dados.component')
            .then(m => m.MatriculaAtualizarDadosComponent),
      },
      {
        path: 'matriculas/transferencia', ...sec,
        loadComponent: () =>
          import('./features/matriculas/pages/matricula-transferencia/matricula-transferencia.component')
            .then(m => m.MatriculaTransferenciaComponent),
      },
      {
        path: 'matriculas/cancelar', ...sec,
        loadComponent: () =>
          import('./features/matriculas/pages/matricula-cancelar/matricula-cancelar.component')
            .then(m => m.MatriculaCancelarComponent),
      },
      {
        path: 'matriculas/pendencias', ...sec,
        loadComponent: () =>
          import('./features/matriculas/pages/matricula-pendencias/matricula-pendencias.component')
            .then(m => m.MatriculaPendenciasComponent),
      },

      // ── Turmas / Disciplinas / Notas / Frequências / Docs / Usuários ──
      {
        path: 'turmas', ...sec,
        loadComponent: () =>
          import('./features/turmas/pages/turma-list/turma-list.component')
            .then(m => m.TurmaListComponent),
      },
      {
        path: 'disciplinas', ...both,
        loadComponent: () =>
          import('./features/disciplinas/pages/disciplina-list/disciplina-list.component')
            .then(m => m.DisciplinaListComponent),
      },
      {
        path: 'notas', ...both,
        loadComponent: () =>
          import('./features/notas/pages/nota-list/nota-list.component')
            .then(m => m.NotaListComponent),
      },
      {
        path: 'frequencias', ...both,
        loadComponent: () =>
          import('./features/frequencias/pages/frequencia-list/frequencia-list.component')
            .then(m => m.FrequenciaListComponent),
      },
      {
        path: 'frequencias/lancar', ...both,
        loadComponent: () =>
          import('./features/frequencias/pages/inserir-frequencia/inserir-frequencia.component')
            .then(m => m.InserirFrequenciaComponent),
      },
      {
        path: 'documentos', ...sec,
        loadComponent: () =>
          import('./features/documentos/pages/documento-list/documento-list.component')
            .then(m => m.DocumentoListComponent),
      },
      {
        path: 'usuarios', ...sec,
        loadComponent: () =>
          import('./features/usuarios/pages/usuario-list/usuario-list.component')
            .then(m => m.UsuarioListComponent),
      },
      {
        path: 'eventos', ...sec,
        loadComponent: () =>
          import('./features/eventos/pages/evento-list/evento-list.component')
            .then(m => m.EventoListComponent),
      },

      // ── Modulação placeholders ───────────────────────────────────────
      { path: 'modulacao/professores',     ...placeholder('Professores') },
      { path: 'modulacao/alocacao-turma',  ...placeholder('Alocação de Turma') },
      { path: 'modulacao/carga-horaria',   ...placeholder('Carga Horária') },
      { path: 'modulacao/funcionarios',    ...placeholder('Funcionários') },
      { path: 'modulacao/alocacao-funcao', ...placeholder('Alocação de Função') },
      { path: 'modulacao/insercao',        ...placeholder('Inserção') },

      // ── Turmas placeholders ──────────────────────────────────────────
      {
        path: 'turmas/cadastro', ...sec,
        loadComponent: () =>
          import('./features/turmas/pages/cadastrar-turma/cadastrar-turma.component')
            .then(m => m.CadastrarTurmaComponent),
      },
      {
        path: 'turmas/realocacao', ...sec,
        loadComponent: () =>
          import('./features/turmas/pages/realocacao/realocacao.component')
            .then(m => m.RealocacaoComponent),
      },
      { path: 'turmas/situacao',    ...placeholder('Situação das Turmas') },
      { path: 'turmas/salas',       ...placeholder('Salas') },
      { path: 'turmas/grade',       ...placeholder('Grade Curricular') },
      { path: 'turmas/capacidade',  ...placeholder('Capacidade das Turmas') },

      // ── Documentos placeholders ──────────────────────────────────────
      { path: 'documentos/historico',  ...placeholder('Emitir Histórico') },
      { path: 'documentos/declaracao', ...placeholder('Declaração') },
      { path: 'documentos/atestado',   ...placeholder('Atestado') },

      // ── Sistema ──────────────────────────────────────────────────────
      { path: 'sistema/configuracoes', ...placeholder('Configurações do Sistema') },
    ],
  },

  { path: '**', redirectTo: 'auth/login' },
];
