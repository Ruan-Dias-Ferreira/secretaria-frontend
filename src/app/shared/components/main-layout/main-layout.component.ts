import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  inject,
  signal,
  computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { filter } from 'rxjs';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { HistoryItem, HistoryService } from '../../../core/services/history.service';

export interface NavDropdownItem {
  label?: string;
  route?: string;
  group?: string;
  divider?: boolean;
}

export interface NavTab {
  label: string;
  items: NavDropdownItem[];
}

const ROUTE_LABELS: Record<string, string> = {
  home: 'Home', dashboard: 'Dashboard',
  alunos: 'Alunos', turmas: 'Turmas', disciplinas: 'Disciplinas',
  matriculas: 'Matrículas', nova: 'Nova Matrícula', consultar: 'Consultar',
  rematricula: 'Rematrícula', transferencia: 'Transferência',
  cancelar: 'Cancelar', pendencias: 'Pendências', atualizar: 'Atualizar Dados',
  notas: 'Notas', frequencias: 'Frequências', documentos: 'Documentos',
  usuarios: 'Usuários', modulacao: 'Modulação', professores: 'Professores',
  'alocacao-turma': 'Alocação de Turma', 'carga-horaria': 'Carga Horária',
  funcionarios: 'Funcionários', 'alocacao-funcao': 'Alocação de Função',
  insercao: 'Inserção', cadastro: 'Cadastro', realocacao: 'Realocação',
  situacao: 'Situação', salas: 'Salas', grade: 'Grade', capacidade: 'Capacidade',
  sistema: 'Sistema', configuracoes: 'Configurações',
  historico: 'Histórico', declaracao: 'Declaração', atestado: 'Atestado',
};

@Component({
  selector: 'app-main-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, RouterLinkActive, RouterOutlet, ReactiveFormsModule,
    MatSidenavModule, MatListModule, MatIconModule, MatButtonModule,
    MatMenuModule, MatDividerModule, MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatSelectModule, MatTooltipModule,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  private readonly auth       = inject(AuthService);
  private readonly router     = inject(Router);
  private readonly theme      = inject(ThemeService);
  private readonly history    = inject(HistoryService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly sacOpen      = signal(false);
  protected readonly historyOpen  = signal(false);
  protected readonly sidebarOpen  = signal(false);
  protected readonly filterOpen   = signal(false);
  protected readonly loading      = signal(false);
  protected readonly openDropdown = signal<number | null>(null);
  protected readonly sacMessage   = new FormControl('');
  protected readonly anoLetivo    = new Date().getFullYear();

  protected readonly breadcrumbs    = signal<{ label: string; url: string }[]>([]);
  protected readonly currentUrl     = signal('');
  protected readonly userName       = computed(() => this.auth.getCurrentUser()?.login ?? 'Funcionário');
  protected readonly themeIcon      = computed(() => this.theme.themeIcon());
  protected readonly nextThemeLabel = computed(() => this.theme.nextThemeLabel());
  protected readonly historyItems   = computed(() => this.history.items());
  protected readonly showFilter     = computed(() =>
    this.currentUrl().includes('/matriculas/consultar')
  );

  protected readonly navTabs: NavTab[] = [
    { label: 'Modulação', items: [
      { group: 'PROFESSORES' },
      { label: 'Professores',        route: '/modulacao/professores' },
      { label: 'Alocação de Turma',  route: '/modulacao/alocacao-turma' },
      { label: 'Carga Horária',      route: '/modulacao/carga-horaria' },
      { divider: true },
      { group: 'FUNCIONÁRIOS' },
      { label: 'Funcionários',       route: '/modulacao/funcionarios' },
      { label: 'Alocação de Função', route: '/modulacao/alocacao-funcao' },
      { label: 'Inserção',           route: '/modulacao/insercao' },
    ]},
    { label: 'Turmas', items: [
      { label: 'Cadastrar Turma',    route: '/turmas/cadastro' },
      { label: 'Realocação',         route: '/turmas/realocacao' },
      { label: 'Situação',           route: '/turmas/situacao' },
      { divider: true },
      { group: 'ESTRUTURA' },
      { label: 'Salas',              route: '/turmas/salas' },
      { label: 'Grade Curricular',   route: '/turmas/grade' },
      { label: 'Capacidade',         route: '/turmas/capacidade' },
    ]},
    { label: 'Matrículas', items: [
      { label: 'Nova Matrícula',     route: '/matriculas/nova' },
      { label: 'Consultar',          route: '/matriculas/consultar' },
      { divider: true },
      { group: 'OPERAÇÕES' },
      { label: 'Rematrícula',        route: '/matriculas/rematricula' },
      { label: 'Transferência',      route: '/matriculas/transferencia' },
      { label: 'Cancelamento',       route: '/matriculas/cancelar' },
      { label: 'Pendências',         route: '/matriculas/pendencias' },
    ]},
    { label: 'Documentos', items: [
      { label: 'Emitir Histórico',   route: '/documentos/historico' },
      { label: 'Declaração',         route: '/documentos/declaracao' },
      { label: 'Atestado',           route: '/documentos/atestado' },
      { divider: true },
      { group: 'GERENCIAR' },
      { label: 'Todos os Documentos', route: '/documentos' },
    ]},
  ];

  protected readonly sidebarGroups = [
    { group: 'CONSULTA', items: [
      { label: 'Alunos',               route: '/alunos',                     icon: 'school' },
      { label: 'Professores',          route: '/modulacao/professores',      icon: 'person' },
      { label: 'Funcionários',         route: '/modulacao/funcionarios',     icon: 'badge' },
      { label: 'Turmas',               route: '/turmas/situacao',            icon: 'class' },
      { label: 'Horários',             route: '/modulacao/carga-horaria',    icon: 'schedule' },
    ]},
    { group: 'TRANSPORTE ESCOLAR', items: [
      { label: 'Gerenciar Transporte', route: '/sistema/configuracoes',      icon: 'directions_bus' },
    ]},
  ];

  protected readonly filterAnos = [2024, 2025, 2026, 2027];
  protected readonly filterTurma    = new FormControl('');
  protected readonly filterSituacao = new FormControl('');
  protected readonly filterAno      = new FormControl('');

  constructor() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((e) => {
      const nav = e as NavigationEnd;
      this.currentUrl.set(nav.urlAfterRedirects);
      this.openDropdown.set(null);
      const crumbs = this.buildBreadcrumbs(nav.urlAfterRedirects);
      this.breadcrumbs.set(crumbs);
      const last = crumbs.at(-1);
      if (last) this.history.add(last.label, last.url);
      if (!nav.urlAfterRedirects.includes('/matriculas/consultar')) {
        this.filterOpen.set(false);
      }
    });
  }

  private buildBreadcrumbs(url: string): { label: string; url: string }[] {
    const segments = url.split('?')[0].split('/').filter(Boolean);
    if (!segments.length || (segments.length === 1 && segments[0] === 'dashboard')) return [];
    const crumbs: { label: string; url: string }[] = [{ label: 'Home', url: '/dashboard' }];
    segments.forEach((seg, i) => {
      crumbs.push({ label: ROUTE_LABELS[seg] ?? seg, url: '/' + segments.slice(0, i + 1).join('/') });
    });
    return crumbs;
  }

  protected toggleHistory():    void { this.historyOpen.update(v => !v); this.sacOpen.set(false); }
  protected toggleSac():        void { this.sacOpen.update(v => !v); this.historyOpen.set(false); }
  protected toggleTheme():      void { this.theme.toggleTheme(); }
  protected toggleSidebar():    void { this.sidebarOpen.update(v => !v); }
  protected toggleFilter():     void { this.filterOpen.update(v => !v); }

  protected toggleDropdown(idx: number, e: MouseEvent): void {
    e.stopPropagation();
    this.openDropdown.update(v => v === idx ? null : idx);
  }

  protected navigateDropdown(route: string | undefined): void {
    if (route) { this.router.navigateByUrl(route); this.openDropdown.set(null); }
  }

  protected navigateToHistory(item: HistoryItem): void {
    this.router.navigateByUrl(item.url);
    this.historyOpen.set(false);
  }

  protected enviarSac(): void {
    this.sacMessage.reset();
    this.sacOpen.set(false);
  }

  protected sair(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }

  protected applyFilters(): void {
    const qp: Record<string, string> = {};
    if (this.filterTurma.value)    qp['turma']    = this.filterTurma.value;
    if (this.filterSituacao.value) qp['situacao'] = this.filterSituacao.value;
    if (this.filterAno.value)      qp['ano']      = String(this.filterAno.value);
    this.router.navigate(['/matriculas/consultar'], { queryParams: qp });
  }

  protected clearFilters(): void {
    this.filterTurma.reset(); this.filterSituacao.reset(); this.filterAno.reset();
    this.router.navigate(['/matriculas/consultar']);
  }

  @HostListener('document:click')
  onDocumentClick(): void { this.openDropdown.set(null); }
}
