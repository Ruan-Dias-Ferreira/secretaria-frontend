import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { TurmaRequest } from '../../../../core/models/requests/turma.request';
import { TurmaService } from '../../services/turma.service';

@Component({
  selector: 'app-turma-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './turma-form.component.html',
  styles: [`
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.5);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal {
      background: #fff; border-radius: 8px; padding: 24px;
      width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto;
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .modal-header h2 { margin: 0; }
    .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-grid .full { grid-column: 1 / -1; }
    label { display: block; font-size: 13px; margin-bottom: 4px; color: #374151; }
    input, select { width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; box-sizing: border-box; }
    input.invalid, select.invalid { border-color: #dc2626; }
    .error { color: #dc2626; font-size: 12px; margin-top: 2px; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
    button { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-primary:disabled { background: #93c5fd; cursor: not-allowed; }
    .btn-secondary { background: #e5e7eb; color: #111827; }
    .alert { padding: 8px 12px; background: #fee2e2; color: #991b1b; border-radius: 4px; margin-bottom: 12px; }
  `]
})
export class TurmaFormComponent implements OnInit, OnDestroy {

  @Input() turmaId: number | null = null;
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  errorMsg = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private turmaService: TurmaService
  ) {}

  ngOnInit(): void {
    const anoAtual = new Date().getFullYear();
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      anoLetivo: [anoAtual, [Validators.required, Validators.min(2000), Validators.max(2100)]],
      turno: ['MANHA', [Validators.required]],
      curso: ['', [Validators.required]]
    });

    if (this.turmaId !== null) {
      this.carregarTurma(this.turmaId);
    }
  }

  get isEdicao(): boolean {
    return this.turmaId !== null;
  }

  private carregarTurma(id: number): void {
    this.loading = true;
    this.turmaService.findById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (turma) => {
          this.form.patchValue(turma);
          this.loading = false;
        },
        error: () => {
          this.errorMsg = 'Erro ao carregar dados da turma.';
          this.loading = false;
        }
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMsg = '';
    const request = this.form.value as TurmaRequest;

    const operacao$ = this.isEdicao && this.turmaId !== null
      ? this.turmaService.update(this.turmaId, request)
      : this.turmaService.save(request);

    operacao$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.close.emit();
        },
        error: () => {
          this.errorMsg = 'Erro ao salvar. Verifique os dados.';
          this.loading = false;
        }
      });
  }

  cancelar(): void {
    this.close.emit();
  }

  campoInvalido(nome: string): boolean {
    const c = this.form.get(nome);
    return !!(c && c.invalid && c.touched);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
