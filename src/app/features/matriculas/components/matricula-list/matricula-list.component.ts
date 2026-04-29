import {
  ChangeDetectionStrategy, Component, inject, signal, computed, DestroyRef, OnInit
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';

import { MatTableModule }           from '@angular/material/table';
import { MatButtonModule }          from '@angular/material/button';
import { MatIconModule }            from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatInputModule }           from '@angular/material/input';
import { MatChipsModule }           from '@angular/material/chips';
import { MatDividerModule }         from '@angular/material/divider';

import { MatriculaService, MatriculaStatsResponse } from '../../services/matricula.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { NotificationService }  from '../../../../core/services/notification.service';
import { MatriculaResponse }    from '../../../../core/models/responses/matricula.response';
import { StatusMatricula }      from '../../../../core/models/enums/status-matricula.enum';

@Component({
  selector: 'app-matricula-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatFormFieldModule, MatInputModule, MatChipsModule, MatDividerModule,
  ],
  templateUrl: './matricula-list.component.html',
  styleUrl: './matricula-list.component.scss',
})
export class MatriculaListComponent implements OnInit {
  private readonly svc          = inject(MatriculaService);
  private readonly confirmSvc   = inject(ConfirmDialogService);
  private readonly notification = inject(NotificationService);
  private readonly fb           = inject(NonNullableFormBuilder);
  private readonly destroyRef   = inject(DestroyRef);
  private readonly route        = inject(ActivatedRoute);

  protected readonly loading     = signal(false);
  protected readonly matriculas  = signal<MatriculaResponse[]>([]);
  protected readonly stats       = signal<MatriculaStatsResponse>({ total: 0, ativas: 0, transferidas: 0, canceladas: 0 });
  protected readonly filtroAtivo = signal<StatusMatricula | null>(null);
  protected readonly searchCtrl  = this.fb.control('');
  protected readonly expanded    = signal<Set<string>>(new Set());

  protected readonly displayedColumns = ['aluno', 'turma', 'turno', 'situacao', 'ano', 'acoes'];
  protected readonly StatusMatricula  = StatusMatricula;
  protected readonly String = String;

  protected readonly filtradas = computed(() => {
    const status = this.filtroAtivo();
    if (!status) return this.matriculas();
    return this.matriculas().filter(m => m.status === status);
  });

  protected readonly turmasAgrupadas = computed(() => {
    const map = new Map<number, MatriculaResponse[]>();
    this.filtradas().forEach(m => {
      if (!map.has(m.turmaId)) map.set(m.turmaId, []);
      map.get(m.turmaId)!.push(m);
    });
    return Array.from(map.entries()).map(([turmaId, alunos]) => ({ turmaId, alunos }));
  });

  ngOnInit(): void {
    this.carregarStats();
    this.carregarTodos();

    this.searchCtrl.valueChanges.pipe(
      debounceTime(400), distinctUntilChanged(),
      switchMap(q => {
        if (!q) { this.carregarTodos(); return of(null); }
        this.loading.set(true);
        return this.svc.search(q).pipe(catchError(() => of([])));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(r => {
      if (r !== null) { this.matriculas.set(r as MatriculaResponse[]); this.loading.set(false); }
    });

    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(p => {
      if (p['situacao']) this.filtroAtivo.set(p['situacao'] as StatusMatricula);
    });
  }

  private carregarTodos(): void {
    this.loading.set(true);
    this.svc.findAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: d => { this.matriculas.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private carregarStats(): void {
    this.svc.getStats().pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: s => this.stats.set(s), error: () => {} });
  }

  protected toggleFiltro(status: StatusMatricula): void {
    this.filtroAtivo.update(v => v === status ? null : status);
  }

  protected toggleExpand(key: string): void {
    this.expanded.update(s => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }

  protected isExpanded(key: string): boolean { return this.expanded().has(key); }

  protected badgeClass(status: StatusMatricula): string {
    const m: Record<StatusMatricula, string> = {
      [StatusMatricula.ATIVO]:      'badge badge-green',
      [StatusMatricula.TRANSFERIDO]:'badge badge-yellow',
      [StatusMatricula.DESISTENTE]: 'badge badge-red',
      [StatusMatricula.CONCLUIDA]:  'badge badge-blue',
    };
    return m[status] ?? 'badge';
  }

  protected badgeLabel(status: StatusMatricula): string {
    const m: Record<StatusMatricula, string> = {
      [StatusMatricula.ATIVO]:      'Ativa',
      [StatusMatricula.TRANSFERIDO]:'Transferida',
      [StatusMatricula.DESISTENTE]: 'Cancelada',
      [StatusMatricula.CONCLUIDA]:  'Concluída',
    };
    return m[status] ?? status;
  }
}
