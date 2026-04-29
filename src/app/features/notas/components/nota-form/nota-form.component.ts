import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, Subject, takeUntil } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { NotaRequest } from '../../../../core/models/requests/nota.request';
import { NotaService } from '../../services/nota.service';
import { AlunoService } from '../../../alunos/services/aluno.service';
import { DisciplinaService } from '../../../disciplinas/services/disciplina.service';
import { AlunoResponse } from '../../../../core/models/responses/aluno.response';
import { DisciplinaResponse } from '../../../../core/models/responses/disciplina.response';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-nota-form',
  standalone: true,
  imports: [
    CommonModule,
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
export class NotaFormComponent implements OnInit, OnDestroy {

  @Input() notaId: number | null = null;
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;

  alunos: AlunoResponse[] = [];
  disciplinas: DisciplinaResponse[] = [];
  readonly bimestres = [1, 2, 3, 4];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private notaService: NotaService,
    private alunoService: AlunoService,
    private disciplinaService: DisciplinaService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      alunoId:      [null, [Validators.required]],
      disciplinaId: [null, [Validators.required]],
      bimestre:     [1, [Validators.required, Validators.min(1), Validators.max(4)]],
      valor:        [0, [Validators.required, Validators.min(0), Validators.max(10)]]
    });

    this.carregarDropdowns();
  }

  get isEdicao(): boolean { return this.notaId !== null; }

  private carregarDropdowns(): void {
    this.loading = true;
    forkJoin({
      alunos: this.alunoService.findAll(),
      disciplinas: this.disciplinaService.findAll()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ alunos, disciplinas }) => {
          this.alunos = alunos;
          this.disciplinas = disciplinas;
          if (this.notaId !== null) {
            this.carregarNota(this.notaId);
          } else {
            this.loading = false;
          }
        },
        error: () => { this.loading = false; }
      });
  }

  private carregarNota(id: number): void {
    this.notaService.findById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: n => {
          this.form.patchValue({
            alunoId: n.alunoId,
            disciplinaId: n.disciplinaId,
            bimestre: n.bimestre,
            valor: n.valor
          });
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const request = this.form.value as NotaRequest;

    const op$ = this.isEdicao && this.notaId !== null
      ? this.notaService.update(this.notaId, request)
      : this.notaService.save(request);

    op$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loading = false;
        this.notification.success(this.isEdicao ? 'Nota atualizada.' : 'Nota cadastrada.');
        this.close.emit();
      },
      error: () => { this.loading = false; }
    });
  }

  cancelar(): void { this.close.emit(); }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
