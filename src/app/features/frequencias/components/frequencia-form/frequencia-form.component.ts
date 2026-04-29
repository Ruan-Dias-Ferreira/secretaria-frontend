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
import { MatCheckboxModule } from '@angular/material/checkbox';

import { FrequenciaRequest } from '../../../../core/models/requests/frequencia.request';
import { FrequenciaService } from '../../services/frequencia.service';
import { AlunoService } from '../../../alunos/services/aluno.service';
import { DisciplinaService } from '../../../disciplinas/services/disciplina.service';
import { AlunoResponse } from '../../../../core/models/responses/aluno.response';
import { DisciplinaResponse } from '../../../../core/models/responses/disciplina.response';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-frequencia-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule
  ],
  templateUrl: './frequencia-form.component.html',
  styles: [`
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.45);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .dialog-card {
      background: #fff; border-radius: 12px; padding: 28px 32px;
      width: 90%; max-width: 520px; max-height: 90vh; overflow-y: auto;
      box-shadow: 0 8px 30px rgba(0,0,0,.2);
    }
    .dialog-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .dialog-title h2 { margin: 0; font-weight: 500; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .form-grid .full { grid-column: 1 / -1; }
    .dialog-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
    .loading-inline { display: flex; align-items: center; gap: 8px; }
    .spinner-center { display: flex; justify-content: center; padding: 32px 0; }
  `]
})
export class FrequenciaFormComponent implements OnInit, OnDestroy {

  @Input() frequenciaId: number | null = null;
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;

  alunos: AlunoResponse[] = [];
  disciplinas: DisciplinaResponse[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private frequenciaService: FrequenciaService,
    private alunoService: AlunoService,
    private disciplinaService: DisciplinaService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    const hoje = new Date().toISOString().substring(0, 10);
    this.form = this.fb.group({
      alunoId:      [null, [Validators.required]],
      disciplinaId: [null, [Validators.required]],
      data:         [hoje, [Validators.required]],
      presente:     [true]
    });
    this.carregarDropdowns();
  }

  get isEdicao(): boolean { return this.frequenciaId !== null; }

  private carregarDropdowns(): void {
    this.loading = true;
    forkJoin({
      alunos:      this.alunoService.findAll(),
      disciplinas: this.disciplinaService.findAll()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ alunos, disciplinas }) => {
          this.alunos      = alunos;
          this.disciplinas = disciplinas;
          if (this.frequenciaId !== null) {
            this.carregarFrequencia(this.frequenciaId);
          } else {
            this.loading = false;
          }
        },
        error: () => { this.loading = false; }
      });
  }

  private carregarFrequencia(id: number): void {
    this.frequenciaService.findById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: freq => { this.form.patchValue(freq); this.loading = false; },
        error: () => { this.loading = false; }
      });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    const request = this.form.value as FrequenciaRequest;
    const op$ = this.isEdicao && this.frequenciaId !== null
      ? this.frequenciaService.update(this.frequenciaId, request)
      : this.frequenciaService.save(request);

    op$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notification.success(this.isEdicao ? 'Frequência atualizada.' : 'Frequência registrada.');
        this.loading = false;
        this.close.emit();
      },
      error: () => { this.loading = false; }
    });
  }

  cancelar(): void { this.close.emit(); }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
