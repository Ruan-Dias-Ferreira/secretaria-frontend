import {
  ChangeDetectionStrategy, Component, inject, signal, DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';

import { MatButtonModule }       from '@angular/material/button';
import { MatIconModule }         from '@angular/material/icon';
import { MatFormFieldModule }    from '@angular/material/form-field';
import { MatInputModule }        from '@angular/material/input';
import { MatSelectModule }       from '@angular/material/select';
import { MatDatepickerModule }   from '@angular/material/datepicker';
import { MatNativeDateModule }   from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AlunoService }        from '../../../alunos/data-access/aluno.service';
import { MatriculaService }    from '../../data-access/matricula.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { HistoryService }      from '../../../../core/services/history.service';
import { AlunoResponse }       from '../../../../core/models/responses/aluno.response';

const MOTIVOS = ['Desistência', 'Transferência para outra escola', 'Documentação incompleta', 'Outro'];

@Component({
  selector: 'app-matricula-cancelar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule,
  ],
  templateUrl: './matricula-cancelar.component.html',
  styleUrl: './matricula-cancelar.component.scss',
})
export class MatriculaCancelarComponent {
  private readonly fb           = inject(NonNullableFormBuilder);
  private readonly alunoSvc     = inject(AlunoService);
  private readonly matriculaSvc = inject(MatriculaService);
  private readonly confirmSvc   = inject(ConfirmDialogService);
  private readonly notification = inject(NotificationService);
  private readonly history      = inject(HistoryService);
  private readonly destroyRef   = inject(DestroyRef);

  protected readonly motivos   = MOTIVOS;
  protected readonly submitting = signal(false);
  protected readonly busca      = this.fb.control('');
  protected readonly buscaResults = signal<AlunoResponse[]>([]);
  protected readonly showDropdown = signal(false);
  protected readonly searching    = signal(false);
  protected readonly alunoSelecionado = signal<AlunoResponse | null>(null);
  protected readonly matriculaId = signal<number | null>(null);

  protected readonly form = this.fb.group({
    motivo:     ['', Validators.required],
    dataCancelamento: [new Date() as Date, Validators.required],
    observacoes:[''],
  });

  constructor() {
    this.busca.valueChanges.pipe(
      debounceTime(350), distinctUntilChanged(),
      switchMap(q => {
        if (!q || q.length < 2) { this.buscaResults.set([]); this.showDropdown.set(false); return of([]); }
        this.searching.set(true);
        return this.alunoSvc.search(q).pipe(catchError(() => of([])));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(r => {
      this.buscaResults.set(r as AlunoResponse[]);
      this.showDropdown.set((r as AlunoResponse[]).length > 0);
      this.searching.set(false);
    });
  }

  protected selecionarAluno(a: AlunoResponse): void {
    this.alunoSelecionado.set(a);
    this.showDropdown.set(false);
    this.busca.setValue(a.nome, { emitEvent: false });
  }

  protected cancelarMatricula(): void {
    if (!this.alunoSelecionado() || this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.confirmSvc.confirm({
      title: 'Cancelar Matrícula',
      message: `ATENÇÃO: Esta ação é irreversível. Cancelar a matrícula de ${this.alunoSelecionado()!.nome}?`,
      confirmLabel: 'Cancelar Matrícula', cancelLabel: 'Voltar',
      destructive: true,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(ok => {
      if (!ok) return;
      this.submitting.set(true);
      const v = this.form.getRawValue();
      this.matriculaSvc.cancelar(0, v.motivo, v.observacoes).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.submitting.set(false);
          this.notification.success('Matrícula cancelada.');
          this.history.add(`Cancelamento — ${this.alunoSelecionado()!.nome}`, '/matriculas/cancelar');
          this.limpar();
        },
        error: () => this.submitting.set(false),
      });
    });
  }

  protected limpar(): void {
    this.alunoSelecionado.set(null); this.busca.reset(); this.form.reset();
  }
}
