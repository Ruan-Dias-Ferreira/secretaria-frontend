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

const MOTIVOS = ['Mudança de endereço', 'Solicitação da família', 'Vaga indisponível', 'Outro'];

@Component({
  selector: 'app-matricula-transferencia',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule,
  ],
  templateUrl: './matricula-transferencia.component.html',
  styleUrl: './matricula-transferencia.component.scss',
})
export class MatriculaTransferenciaComponent {
  private readonly fb           = inject(NonNullableFormBuilder);
  private readonly alunoSvc     = inject(AlunoService);
  private readonly matriculaSvc = inject(MatriculaService);
  private readonly confirmSvc   = inject(ConfirmDialogService);
  private readonly notification = inject(NotificationService);
  private readonly history      = inject(HistoryService);
  private readonly destroyRef   = inject(DestroyRef);

  protected readonly motivos    = MOTIVOS;
  protected readonly submitting = signal(false);
  protected readonly busca      = this.fb.control('');
  protected readonly buscaResults = signal<AlunoResponse[]>([]);
  protected readonly showDropdown = signal(false);
  protected readonly searching    = signal(false);
  protected readonly alunoSelecionado = signal<AlunoResponse | null>(null);

  protected readonly form = this.fb.group({
    escolaDestino:     ['', [Validators.required, Validators.maxLength(120)]],
    dataTransferencia: [new Date() as Date, Validators.required],
    motivo:            ['', Validators.required],
    observacoes:       [''],
  });

  constructor() {
    this.busca.valueChanges.pipe(
      debounceTime(350), distinctUntilChanged(),
      switchMap(q => {
        if (!q || q.length < 2) {
          this.buscaResults.set([]); this.showDropdown.set(false); return of([]);
        }
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

  protected confirmar(): void {
    if (!this.alunoSelecionado() || this.form.invalid) {
      this.form.markAllAsTouched(); return;
    }
    const aluno = this.alunoSelecionado()!;
    const v = this.form.getRawValue();

    this.confirmSvc.confirm({
      title: 'Confirmar Transferência Externa',
      message: `Transferir ${aluno.nome} para ${v.escolaDestino}?`,
      confirmLabel: 'Confirmar', cancelLabel: 'Cancelar',
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(ok => {
      if (!ok) return;
      this.submitting.set(true);

      const req = {
        tipo: 'EXTERNA' as const,
        escolaDestino: v.escolaDestino,
        dataTransferencia: new Date(v.dataTransferencia).toISOString().split('T')[0],
        motivo: v.motivo,
        observacoes: v.observacoes,
      };

      // uses id 0 as placeholder since we don't fetch the matricula id in this flow
      this.matriculaSvc.transferir(0, req)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.submitting.set(false);
            this.notification.success('Transferência externa registrada com sucesso!');
            this.history.add(`Transferência — ${aluno.nome}`, '/matriculas/transferencia');
            this.cancelar();
          },
          error: () => this.submitting.set(false),
        });
    });
  }

  protected cancelar(): void {
    this.alunoSelecionado.set(null);
    this.busca.reset();
    this.form.reset();
  }
}
