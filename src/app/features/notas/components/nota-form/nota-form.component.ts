import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { NotaRequest } from '../../../../core/models/requests/nota.request';
import { NotaService } from '../../data-access/nota.service';
import { AlunoService } from '../../../alunos/data-access/aluno.service';
import { DisciplinaService } from '../../../disciplinas/data-access/disciplina.service';
import { AlunoResponse } from '../../../../core/models/responses/aluno.response';
import { DisciplinaResponse } from '../../../../core/models/responses/disciplina.response';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-nota-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './nota-form.component.html',
  styles: [`
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.5);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal {
      background: var(--mat-sys-surface); border-radius: 12px; padding: 24px;
      width: 90%; max-width: 560px; max-height: 90vh; overflow-y: auto;
      box-shadow: var(--mat-sys-level3);
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .modal-header h2 { margin: 0; font-size: 20px; font-weight: 500; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
    .form-grid .full { grid-column: 1 / -1; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
    .loading-inline { display: inline-flex; align-items: center; gap: 8px; }
    mat-form-field { width: 100%; }
  `]
})
export class NotaFormComponent implements OnInit {

  readonly notaId = input<number | null>(null);
  readonly close = output<void>();

  private fb = inject(NonNullableFormBuilder);
  private notaService = inject(NotaService);
  private alunoService = inject(AlunoService);
  private disciplinaService = inject(DisciplinaService);
  private notification = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  protected loading = signal(false);
  protected alunos = signal<AlunoResponse[]>([]);
  protected disciplinas = signal<DisciplinaResponse[]>([]);
  readonly bimestres = [1, 2, 3, 4];

  readonly form = this.fb.group({
    alunoId:      this.fb.control<number | null>(null, [Validators.required]),
    disciplinaId: this.fb.control<number | null>(null, [Validators.required]),
    bimestre:     [1, [Validators.required, Validators.min(1), Validators.max(4)]],
    valor:        [0, [Validators.required, Validators.min(0), Validators.max(10)]]
  });

  get isEdicao(): boolean { return this.notaId() !== null; }

  ngOnInit(): void {
    this.carregarDropdowns();
  }

  private carregarDropdowns(): void {
    this.loading.set(true);
    forkJoin({
      alunos: this.alunoService.findAll(),
      disciplinas: this.disciplinaService.findAll()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ alunos, disciplinas }) => {
          this.alunos.set(alunos);
          this.disciplinas.set(disciplinas);
          const id = this.notaId();
          if (id !== null) {
            this.carregarNota(id);
          } else {
            this.loading.set(false);
          }
        },
        error: () => { this.loading.set(false); }
      });
  }

  private carregarNota(id: number): void {
    this.notaService.findById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: n => {
          this.form.patchValue({
            alunoId: n.alunoId,
            disciplinaId: n.disciplinaId,
            bimestre: n.bimestre,
            valor: n.valor
          });
          this.loading.set(false);
        },
        error: () => { this.loading.set(false); }
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const request = this.form.getRawValue() as unknown as NotaRequest;
    const id = this.notaId();

    const op$ = this.isEdicao && id !== null
      ? this.notaService.update(id, request)
      : this.notaService.save(request);

    op$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading.set(false);
        this.notification.success(this.isEdicao ? 'Nota atualizada.' : 'Nota cadastrada.');
        this.close.emit();
      },
      error: () => { this.loading.set(false); }
    });
  }

  cancelar(): void { this.close.emit(); }
}
