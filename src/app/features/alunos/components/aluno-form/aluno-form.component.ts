import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AlunoRequest } from '../../../../core/models/requests/aluno.request';
import { AlunoService } from '../../services/aluno.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-aluno-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './aluno-form.component.html',
  styles: [`
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.5);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
      padding: 16px;
    }
    .modal {
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
      border-radius: 12px;
      padding: 24px;
      width: 100%; max-width: 720px; max-height: 90vh; overflow-y: auto;
      box-shadow: var(--mat-sys-level3);
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 16px;
    }
    .modal-header h2 { margin: 0; font-size: 22px; font-weight: 500; }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }
    .full { grid-column: 1 / -1; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
  `]
})
export class AlunoFormComponent implements OnInit, OnDestroy {
  @Input() alunoId: number | null = null;
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private alunoService: AlunoService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      cpf: ['', [Validators.required]],
      rg: ['', [Validators.required]],
      dataNascimento: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', [Validators.required]],
      endereco: ['', [Validators.required]],
      nomeMae: ['', [Validators.required]],
      nomePai: ['']
    });

    if (this.alunoId !== null) this.carregarAluno(this.alunoId);
  }

  get isEdicao(): boolean { return this.alunoId !== null; }

  private carregarAluno(id: number): void {
    this.loading = true;
    this.alunoService.findById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (aluno) => { this.form.patchValue(aluno); this.loading = false; },
        error: () => { this.loading = false; }
      });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading = true;
    const request = this.form.value as AlunoRequest;
    const operacao$ = this.isEdicao && this.alunoId !== null
      ? this.alunoService.update(this.alunoId, request)
      : this.alunoService.save(request);

    operacao$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loading = false;
        this.notification.success(this.isEdicao ? 'Aluno atualizado.' : 'Aluno cadastrado.');
        this.close.emit();
      },
      error: () => { this.loading = false; }
    });
  }

  cancelar(): void { this.close.emit(); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
