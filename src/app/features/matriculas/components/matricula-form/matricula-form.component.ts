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

import { MatriculaRequest } from '../../../../core/models/requests/matricula.request';
import { MatriculaService } from '../../services/matricula.service';
import { AlunoService } from '../../../alunos/services/aluno.service';
import { TurmaService } from '../../../turmas/services/turma.service';
import { AlunoResponse } from '../../../../core/models/responses/aluno.response';
import { TurmaResponse } from '../../../../core/models/responses/turma.response';
import { StatusMatricula } from '../../../../core/models/enums/status-matricula.enum';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-matricula-form',
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
  templateUrl: './matricula-form.component.html',
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
export class MatriculaFormComponent implements OnInit, OnDestroy {

  @Input() matriculaId: number | null = null;
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;

  alunos: AlunoResponse[] = [];
  turmas: TurmaResponse[] = [];
  readonly statusOptions = Object.values(StatusMatricula);

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private matriculaService: MatriculaService,
    private alunoService: AlunoService,
    private turmaService: TurmaService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    const anoAtual = new Date().getFullYear();
    this.form = this.fb.group({
      alunoId:   [null, [Validators.required]],
      turmaId:   [null, [Validators.required]],
      anoLetivo: [anoAtual, [Validators.required, Validators.min(2000), Validators.max(2100)]],
      status:    [StatusMatricula.ATIVO, [Validators.required]]
    });

    this.carregarDropdowns();
  }

  get isEdicao(): boolean { return this.matriculaId !== null; }

  private carregarDropdowns(): void {
    this.loading = true;
    forkJoin({
      alunos: this.alunoService.findAll(),
      turmas: this.turmaService.findAll()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ alunos, turmas }) => {
          this.alunos = alunos;
          this.turmas = turmas;
          if (this.matriculaId !== null) {
            this.carregarMatricula(this.matriculaId);
          } else {
            this.loading = false;
          }
        },
        error: () => { this.loading = false; }
      });
  }

  private carregarMatricula(id: number): void {
    this.matriculaService.findById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: m => { this.form.patchValue(m); this.loading = false; },
        error: () => { this.loading = false; }
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const request = this.form.value as MatriculaRequest;

    const op$ = this.isEdicao && this.matriculaId !== null
      ? this.matriculaService.update(this.matriculaId, request)
      : this.matriculaService.save(request);

    op$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loading = false;
        this.notification.success(this.isEdicao ? 'Matrícula atualizada.' : 'Matrícula cadastrada.');
        this.close.emit();
      },
      error: () => { this.loading = false; }
    });
  }

  cancelar(): void { this.close.emit(); }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
