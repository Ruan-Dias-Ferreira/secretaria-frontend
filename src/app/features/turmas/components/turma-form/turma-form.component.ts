import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TurmaRequest } from '../../../../core/models/requests/turma.request';
import { TurmaService } from '../../services/turma.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-turma-form',
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
  templateUrl: './turma-form.component.html',
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
export class TurmaFormComponent implements OnInit, OnDestroy {

  @Input() turmaId: number | null = null;
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;

  readonly turnos = [
    { value: 'MANHA',     label: 'Manhã' },
    { value: 'TARDE',     label: 'Tarde' },
    { value: 'NOITE',     label: 'Noite' },
    { value: 'INTEGRAL',  label: 'Integral' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private turmaService: TurmaService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    const anoAtual = new Date().getFullYear();
    this.form = this.fb.group({
      nome:      ['', [Validators.required, Validators.minLength(2)]],
      anoLetivo: [anoAtual, [Validators.required, Validators.min(2000), Validators.max(2100)]],
      turno:     ['MANHA', [Validators.required]],
      curso:     ['', [Validators.required]]
    });

    if (this.turmaId !== null) {
      this.carregarTurma(this.turmaId);
    }
  }

  get isEdicao(): boolean { return this.turmaId !== null; }

  private carregarTurma(id: number): void {
    this.loading = true;
    this.turmaService.findById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: t => { this.form.patchValue(t); this.loading = false; },
        error: () => { this.loading = false; }
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const request = this.form.value as TurmaRequest;

    const op$ = this.isEdicao && this.turmaId !== null
      ? this.turmaService.update(this.turmaId, request)
      : this.turmaService.save(request);

    op$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loading = false;
        this.notification.success(this.isEdicao ? 'Turma atualizada.' : 'Turma cadastrada.');
        this.close.emit();
      },
      error: () => { this.loading = false; }
    });
  }

  cancelar(): void { this.close.emit(); }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
