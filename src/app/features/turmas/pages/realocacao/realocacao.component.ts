import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, forkJoin, of, switchMap } from 'rxjs';

import { MatButtonModule }          from '@angular/material/button';
import { MatIconModule }            from '@angular/material/icon';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatInputModule }           from '@angular/material/input';
import { MatSelectModule }          from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AlunoService }        from '../../../alunos/data-access/aluno.service';
import { TurmaService }        from '../../data-access/turma.service';
import { MatriculaService }    from '../../../matriculas/data-access/matricula.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';

import { AlunoResponse }     from '../../../../core/models/responses/aluno.response';
import { TurmaResponse }     from '../../../../core/models/responses/turma.response';
import { MatriculaResponse } from '../../../../core/models/responses/matricula.response';
import { StatusMatricula }   from '../../../../core/models/enums/status-matricula.enum';

@Component({
  selector: 'app-realocacao',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule,
  ],
  templateUrl: './realocacao.component.html',
  styleUrl: './realocacao.component.scss',
})
export class RealocacaoComponent {
  private readonly fb           = inject(NonNullableFormBuilder);
  private readonly alunoSvc     = inject(AlunoService);
  private readonly turmaSvc     = inject(TurmaService);
  private readonly matriculaSvc = inject(MatriculaService);
  private readonly confirmSvc   = inject(ConfirmDialogService);
  private readonly notify       = inject(NotificationService);
  private readonly destroyRef   = inject(DestroyRef);

  protected readonly anoAtual = new Date().getFullYear();

  protected readonly busca         = this.fb.control('');
  protected readonly buscaResults  = signal<AlunoResponse[]>([]);
  protected readonly showDropdown  = signal(false);
  protected readonly searching     = signal(false);
  protected readonly alunoSelecionado = signal<AlunoResponse | null>(null);
  protected readonly matriculaAtual = signal<MatriculaResponse | null>(null);
  protected readonly turmas         = signal<TurmaResponse[]>([]);
  protected readonly submitting     = signal(false);
  protected readonly carregandoMatricula = signal(false);
  private readonly matriculasAtuais = signal<MatriculaResponse[]>([]);
  private readonly alunosAtivosIds  = computed(() =>
    new Set(this.matriculasAtuais()
      .filter(m => m.anoLetivo === this.anoAtual && m.status === StatusMatricula.ATIVA)
      .map(m => m.alunoId)));

  protected readonly turmasDestino = computed(() => {
    const atual = this.matriculaAtual();
    return this.turmas().filter(t =>
      t.anoLetivo === this.anoAtual
      && t.operavel
      && !t.rematricula
      && (!atual || t.id !== atual.turmaId)
    );
  });

  protected readonly turmaAtualNome = computed(() => {
    const m = this.matriculaAtual();
    if (!m) return null;
    return this.turmas().find(t => t.id === m.turmaId)?.nome ?? `Turma #${m.turmaId}`;
  });

  protected readonly form = this.fb.group({
    novaTurmaId: [0 as number, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    forkJoin({
      turmas: this.turmaSvc.findAll().pipe(catchError(() => of([] as TurmaResponse[]))),
      matriculas: this.matriculaSvc.findAll().pipe(catchError(() => of([] as MatriculaResponse[]))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ turmas, matriculas }) => {
      this.turmas.set(turmas);
      this.matriculasAtuais.set(matriculas);
    });

    this.busca.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap(q => {
          const t = (q ?? '').trim();
          if (t.length < 2) { this.showDropdown.set(false); return of([]); }
          this.searching.set(true);
          return this.alunoSvc.search(t).pipe(catchError(() => of([])));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(rs => {
        const ativos = this.alunosAtivosIds();
        const filtrados = (rs as AlunoResponse[]).filter(a => ativos.has(a.id));
        this.buscaResults.set(filtrados);
        this.showDropdown.set(filtrados.length > 0);
        this.searching.set(false);
      });
  }

  protected selecionarAluno(a: AlunoResponse): void {
    this.alunoSelecionado.set(a);
    this.showDropdown.set(false);
    this.busca.setValue(a.nome, { emitEvent: false });
    this.carregarMatriculaAtiva(a.id);
  }

  protected trocarAluno(): void {
    this.alunoSelecionado.set(null);
    this.matriculaAtual.set(null);
    this.busca.reset('');
    this.form.reset({ novaTurmaId: 0 });
  }

  private carregarMatriculaAtiva(alunoId: number): void {
    const ativa = this.matriculasAtuais().find(m =>
      m.alunoId === alunoId
      && m.anoLetivo === this.anoAtual
      && m.status === StatusMatricula.ATIVA
    ) ?? null;
    this.matriculaAtual.set(ativa);
    if (!ativa) this.notify.info(`Aluno não possui matrícula ATIVA em ${this.anoAtual}.`);
  }

  protected confirmar(): void {
    const aluno = this.alunoSelecionado();
    const matricula = this.matriculaAtual();
    if (!aluno || !matricula) {
      this.notify.error('Selecione um aluno com matrícula ativa.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const novaTurmaId = this.form.getRawValue().novaTurmaId;
    const novaTurma = this.turmas().find(t => t.id === novaTurmaId);
    if (!novaTurma) {
      this.notify.error('Turma destino inválida.');
      return;
    }

    this.confirmSvc.confirm({
      title: 'Confirmar Realocação',
      message: `Realocar ${aluno.nome} de "${this.turmaAtualNome()}" para "${novaTurma.nome}"? `
             + 'Notas e frequência serão mantidas.',
      confirmLabel: 'Confirmar', cancelLabel: 'Cancelar',
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(ok => {
      if (!ok) return;
      this.submitting.set(true);
      this.matriculaSvc.realocar({ alunoId: aluno.id, novaTurmaId })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.submitting.set(false);
            this.notify.success(`${aluno.nome} realocado para ${novaTurma.nome}.`);
            this.trocarAluno();
          },
          error: err => {
            this.submitting.set(false);
            const msg = err?.error?.message ?? err?.error?.error ?? 'Erro ao realocar.';
            this.notify.error(msg);
          },
        });
    });
  }

  protected cancelar(): void { this.trocarAluno(); }
}
