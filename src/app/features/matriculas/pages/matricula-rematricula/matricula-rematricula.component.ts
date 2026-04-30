import {
  ChangeDetectionStrategy, Component, inject, signal, DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { switchMap, of, catchError } from 'rxjs';

import { MatButtonModule }          from '@angular/material/button';
import { MatIconModule }            from '@angular/material/icon';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatInputModule }           from '@angular/material/input';
import { MatSelectModule }          from '@angular/material/select';
import { MatCheckboxModule }        from '@angular/material/checkbox';
import { MatTableModule }           from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule }         from '@angular/material/divider';

import { AlunoService }        from '../../../alunos/data-access/aluno.service';
import { TurmaService }        from '../../../turmas/data-access/turma.service';
import { MatriculaService }    from '../../data-access/matricula.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { HistoryService }      from '../../../../core/services/history.service';

import { AlunoResponse }  from '../../../../core/models/responses/aluno.response';
import { TurmaResponse }  from '../../../../core/models/responses/turma.response';
import { MatriculaResponse } from '../../../../core/models/responses/matricula.response';

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
  private readonly destroyRef   = inject(DestroyRef);

  protected readonly anoDestino = new Date().getFullYear() + 1;
  protected readonly turmas     = signal<TurmaResponse[]>([]);
  protected readonly passo      = signal<1 | 2>(1);
  protected readonly loading    = signal(false);
  protected readonly alunos     = signal<AlunoResponse[]>([]);
  protected readonly selecionados = signal<Set<number>>(new Set());
  protected readonly painelAberto  = signal(false);
  protected readonly alunosConsulta = signal<MatriculaResponse[]>([]);

  protected readonly turnos  = ['Manhã', 'Tarde', 'Noite'];
  protected readonly series  = ['1º Ano', '2º Ano', '3º Ano'];

  protected readonly destinoForm = this.fb.group({
    serie:  ['', Validators.required],
    turmaId:[0 as number, Validators.required],
    turno:  ['', Validators.required],
  });

  protected readonly buscaForm = this.fb.group({
    nome:   [''],
    turma:  [''],
    turno:  [''],
  });

  protected readonly consultaForm = this.fb.group({
    serie: [''], turma: [''], turno: [''],
  });

  constructor() {
    this.turmaSvc.findAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(t => this.turmas.set(t));
  }

  protected continuar(): void {
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

  protected selecionarTodos(): void {
    this.selecionados.set(new Set(this.alunos().map(a => a.id)));
  }

  protected rematricular(): void {
    if (this.selecionados().size === 0) return;
    const nomes = this.alunos()
      .filter(a => this.selecionados().has(a.id))
      .map(a => a.nome).join(', ');
    this.confirmSvc.confirm({
      title: 'Confirmar Rematrícula',
      message: `Rematricular ${this.selecionados().size} aluno(s) para ${this.anoDestino}?`,
      confirmLabel: 'Confirmar', cancelLabel: 'Cancelar',
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(ok => {
      if (!ok) return;
      const destino = this.destinoForm.getRawValue();
      const reqs = Array.from(this.selecionados()).map(alunoId =>
        this.matriculaSvc.rematricular({ alunoId, turmaDestinoId: destino.turmaId, anoLetivo: this.anoDestino })
      );
      this.notification.success(`${reqs.length} aluno(s) rematriculado(s) com sucesso!`);
      this.history.add('Rematrícula em lote', '/matriculas/rematricula');
      this.selecionados.set(new Set());
    });
  }

  protected isSelecionado(id: number): boolean { return this.selecionados().has(id); }

  protected consultar(): void {
    this.matriculaSvc.findAll().pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(r => this.alunosConsulta.set(r));
  }
}
