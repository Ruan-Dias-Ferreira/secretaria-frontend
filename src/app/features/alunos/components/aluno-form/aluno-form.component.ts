import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { AlunoRequest } from '../../../../core/models/requests/aluno.request';
import { AlunoService } from '../../services/aluno.service';

@Component({
  selector: 'app-aluno-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './aluno-form.component.html',
  styles: [`
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.5);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal {
      background: #fff; border-radius: 8px; padding: 24px;
      width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto;
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .modal-header h2 { margin: 0; }
    .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-grid .full { grid-column: 1 / -1; }
    label { display: block; font-size: 13px; margin-bottom: 4px; color: #374151; }
    input { width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; box-sizing: border-box; }
    input.invalid { border-color: #dc2626; }
    .error { color: #dc2626; font-size: 12px; margin-top: 2px; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
    button { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-primary:disabled { background: #93c5fd; cursor: not-allowed; }
    .btn-secondary { background: #e5e7eb; color: #111827; }
    .alert { padding: 8px 12px; background: #fee2e2; color: #991b1b; border-radius: 4px; margin-bottom: 12px; }
  `]
})
export class AlunoFormComponent implements OnInit, OnDestroy {

  @Input() alunoId: number | null = null;
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  errorMsg = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private alunoService: AlunoService
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

    if (this.alunoId !== null) {
      this.carregarAluno(this.alunoId);
    }
  }

  get isEdicao(): boolean {
    return this.alunoId !== null;
  }

  private carregarAluno(id: number): void {
    this.loading = true;
    this.alunoService.findById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (aluno) => {
          this.form.patchValue(aluno);
          this.loading = false;
        },
        error: () => {
          this.errorMsg = 'Erro ao carregar dados do aluno.';
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
    const request = this.form.value as AlunoRequest;

    const operacao$ = this.isEdicao && this.alunoId !== null
      ? this.alunoService.update(this.alunoId, request)
      : this.alunoService.save(request);

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
