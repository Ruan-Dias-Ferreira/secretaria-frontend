import {
  ChangeDetectionStrategy, Component, inject, signal, DestroyRef, computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';

import { MatButtonModule }          from '@angular/material/button';
import { MatIconModule }            from '@angular/material/icon';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatInputModule }           from '@angular/material/input';
import { MatSelectModule }          from '@angular/material/select';
import { MatCheckboxModule }        from '@angular/material/checkbox';
import { MatTableModule }           from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule }         from '@angular/material/divider';
import { MatDialog }                from '@angular/material/dialog';

import { AlunoService }        from '../../../alunos/data-access/aluno.service';
import { TurmaService }        from '../../../turmas/data-access/turma.service';
import { MatriculaService }    from '../../data-access/matricula.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { HistoryService }      from '../../../../core/services/history.service';

import { AlunoResponse }              from '../../../../core/models/responses/aluno.response';
import { TurmaResponse }              from '../../../../core/models/responses/turma.response';
import { MatriculaResponse }          from '../../../../core/models/responses/matricula.response';
import { RematriculadoResponse }      from '../../../../core/models/responses/rematriculado.response';
import { RematriculaJanelaResponse }  from '../../../../core/models/responses/rematricula-janela.response';
import { StatusMatricula }            from '../../../../core/models/enums/status-matricula.enum';
import { RematriculaEditDialogComponent } from '../../components/rematricula-edit-dialog/rematricula-edit-dialog.component';

@Component({
  selector: 'app-matricula-rematricula',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatCheckboxModule, MatTableModule,
    MatProgressSpinnerModule, MatDividerModule,
  ],
  templateUrl: './matricula-rematricula.component.html',
  styleUrl: './matricula-rematricula.component.scss',
})
export class MatriculaRematriculaComponent {
  private readonly fb           = inject(NonNullableFormBuilder);
  private readonly alunoSvc     = inject(AlunoService);
  private readonly turmaSvc     = inject(TurmaService);
  private readonly matriculaSvc = inject(MatriculaService);
  private readonly confirmSvc   = inject(ConfirmDialogService);
  private readonly notification = inject(NotificationService);
  private readonly history      = inject(HistoryService);
  private readonly router       = inject(Router);
  private readonly route        = inject(ActivatedRoute);
  private readonly dialog       = inject(MatDialog);
  private readonly destroyRef   = inject(DestroyRef);

  protected readonly janela     = signal<RematriculaJanelaResponse | null>(null);
  protected readonly anoDestino = computed(() =>
    this.janela()?.anoLetivoDestino ?? new Date().getFullYear() + 1);
  protected readonly disponivel = computed(() => this.janela()?.disponivel ?? false);

  protected readonly turmas        = signal<TurmaResponse[]>([]);
  protected readonly passo         = signal<1 | 2>(1);
  protected readonly loading       = signal(false);
  protected readonly alunos        = signal<AlunoResponse[]>([]);
  protected readonly selecionados  = signal<Set<number>>(new Set());
  protected readonly rematriculados = signal<RematriculadoResponse[]>([]);

  // Contexto da turma selecionada via deep-link (?turmaId=)
  protected readonly turmaOrigemContext = signal<TurmaResponse | null>(null);

  protected readonly turnos = ['Manhã', 'Tarde', 'Noite'];
  protected readonly series = ['1º Ano', '2º Ano', '3º Ano'];

  protected readonly destinoForm = this.fb.group({
    serie:   ['', Validators.required],
    turmaId: [0 as number, Validators.required],
    turno:   ['', Validators.required],
  });

  protected readonly buscaForm = this.fb.group({
    nome:  [''],
    turma: [''],
    turno: [''],
  });

  protected readonly consultaForm = this.fb.group({
    serie: [''], turma: [''], turno: [''],
  });

  constructor() {
    forkJoin({
      janela:  this.matriculaSvc.getJanelaRematricula().pipe(catchError(() => of(null))),
      turmas:  this.turmaSvc.findAll().pipe(catchError(() => of([] as TurmaResponse[]))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ janela, turmas }) => {
      this.janela.set(janela);
      this.turmas.set(turmas);

      // Deep-link: se veio com ?turmaId=, carregar contexto e pular para passo 2
      const turmaIdParam = Number(this.route.snapshot.queryParamMap.get('turmaId'));
      if (turmaIdParam && janela?.disponivel) {
        const turmaCtx = turmas.find(t => t.id === turmaIdParam) ?? null;
        if (turmaCtx) {
          this.turmaOrigemContext.set(turmaCtx);
          this.buscaForm.patchValue({
            turma: String(turmaCtx.id),
            turno: turmaCtx.turno,
          }, { emitEvent: false });
          this.passo.set(2);
          this.carregarPendentesDaTurma(turmaCtx.id, janela.anoLetivoOrigem);
        }
      }
    });

    this.consultar();
  }

  /**
   * Carrega exclusivamente os alunos pendentes da turma escolhida (deep-link
   * vindo da página de pendências) e os pré-seleciona.
   */
  private carregarPendentesDaTurma(turmaId: number, anoCorrente: number): void {
    this.loading.set(true);
    forkJoin({
      matriculas:    this.matriculaSvc.findAll().pipe(catchError(() => of([] as MatriculaResponse[]))),
      rematriculados: this.matriculaSvc.findRematriculados().pipe(catchError(() => of([] as RematriculadoResponse[]))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ matriculas, rematriculados }) => {
      const jaRematriculados = new Set(rematriculados.map(r => r.alunoId));
      const alunosPendentes = matriculas
        .filter(m => m.turmaId === turmaId
                  && m.anoLetivo === anoCorrente
                  && m.status === StatusMatricula.ATIVO
                  && !jaRematriculados.has(m.alunoId));

      if (alunosPendentes.length === 0) {
        this.alunos.set([]);
        this.loading.set(false);
        return;
      }

      // Carrega os AlunoResponse correspondentes
      forkJoin(alunosPendentes.map(m =>
        this.alunoSvc.findById(m.alunoId).pipe(catchError(() => of(null)))
      )).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(detalhes => {
        const lista = detalhes
          .filter((d): d is NonNullable<typeof d> => !!d)
          .map(d => ({ id: d.id, nome: d.nome, cpf: d.cpf } as AlunoResponse));
        this.alunos.set(lista);
        this.selecionados.set(new Set(lista.map(a => a.id))); // pré-seleciona todos
        this.loading.set(false);
      });
    });
  }

  protected continuar(): void {
    if (!this.disponivel()) {
      this.notification.error('Rematrícula fora da janela permitida.');
      return;
    }
    if (this.destinoForm.invalid) { this.destinoForm.markAllAsTouched(); return; }
    this.passo.set(2);
    this.buscarAlunos();
  }

  protected buscarAlunos(): void {
    const q = this.buscaForm.value.nome ?? '';
    this.loading.set(true);
    this.alunoSvc.search(q || ' ').pipe(
      catchError(() => of([])),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(r => { this.alunos.set(r as AlunoResponse[]); this.loading.set(false); });
  }

  protected toggleSelecionado(id: number): void {
    this.selecionados.update(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  protected isSelecionado(id: number): boolean { return this.selecionados().has(id); }

  protected selecionarTodos(): void {
    this.selecionados.set(new Set(this.alunos().map(a => a.id)));
  }

  protected rematricular(): void {
    if (this.selecionados().size === 0) return;
    const turmaId = this.destinoForm.getRawValue().turmaId;
    if (!turmaId) {
      this.notification.error('Defina a turma de destino antes de rematricular.');
      this.passo.set(1);
      return;
    }
    const ids = Array.from(this.selecionados());

    this.confirmSvc.confirm({
      title: 'Confirmar Rematrícula',
      message: `Rematricular ${ids.length} aluno(s) para ${this.anoDestino()}?`,
      confirmLabel: 'Confirmar', cancelLabel: 'Cancelar',
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(ok => {
      if (!ok) return;
      this.loading.set(true);
      forkJoin(ids.map(alunoId =>
        this.matriculaSvc.rematricular({ alunoId, turmaDestinoId: turmaId })
          .pipe(catchError(() => of(null)))
      )).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(results => {
        const okN  = results.filter(r => r !== null).length;
        const fail = results.length - okN;
        this.loading.set(false);
        this.selecionados.set(new Set());
        if (okN  > 0) this.notification.success(`${okN} aluno(s) rematriculado(s).`);
        if (fail > 0) this.notification.error(`${fail} aluno(s) não puderam ser rematriculados.`);
        this.history.add('Rematrícula em lote', '/matriculas/rematricula');
        this.consultar();
      });
    });
  }

  protected consultar(): void {
    this.matriculaSvc.findRematriculados()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(r => this.rematriculados.set(r));
  }

  protected editar(r: RematriculadoResponse): void {
    if (!this.disponivel()) {
      this.notification.error('Edição só é permitida durante a janela de rematrícula.');
      return;
    }
    const turmasDestino = this.turmas().filter(t => t.anoLetivo === this.anoDestino());
    this.dialog.open(RematriculaEditDialogComponent, {
      width: '480px',
      data: { rematriculado: r, turmas: turmasDestino },
    }).afterClosed().subscribe((novaTurmaId: number | undefined) => {
      if (!novaTurmaId) return;
      this.matriculaSvc.editarRematricula(r.alunoId, {
        alunoId: r.alunoId, turmaDestinoId: novaTurmaId,
      }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.notification.success(`Rematrícula de ${r.nome} atualizada.`);
          this.consultar();
        },
        error: () => this.notification.error('Erro ao editar rematrícula.'),
      });
    });
  }

  protected cancelar(r: RematriculadoResponse): void {
    if (!this.disponivel()) {
      this.notification.error('Cancelamento só é permitido durante a janela de rematrícula.');
      return;
    }
    this.confirmSvc.confirm({
      title: 'Cancelar Rematrícula',
      message: `Cancelar a rematrícula de ${r.nome} para ${r.anoLetivo}?`,
      confirmLabel: 'Cancelar rematrícula', cancelLabel: 'Voltar',
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(ok => {
      if (!ok) return;
      this.matriculaSvc.cancelarRematricula(r.alunoId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.notification.success(`Rematrícula de ${r.nome} cancelada.`);
            this.consultar();
          },
          error: () => this.notification.error('Erro ao cancelar rematrícula.'),
        });
    });
  }
}
