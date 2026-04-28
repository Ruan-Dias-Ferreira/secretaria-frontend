import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { DocumentoRequest } from '../../../../core/models/requests/documento.request';
import { DocumentoService } from '../../services/documento.service';
import { AlunoService } from '../../../alunos/services/aluno.service';
import { AlunoResponse } from '../../../../core/models/responses/aluno.response';
import { TipoDocumento } from '../../../../core/models/enums/tipo-documento.enum';

@Component({
  selector: 'app-documento-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './documento-form.component.html',
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
    .form-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
    label { display: block; font-size: 13px; margin-bottom: 4px; color: #374151; }
    select { width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; box-sizing: border-box; }
    select.invalid { border-color: #dc2626; }
    .error { color: #dc2626; font-size: 12px; margin-top: 2px; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
    button { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-primary:disabled { background: #93c5fd; cursor: not-allowed; }
    .btn-secondary { background: #e5e7eb; color: #111827; }
    .alert { padding: 8px 12px; background: #fee2e2; color: #991b1b; border-radius: 4px; margin-bottom: 12px; }
    .info { padding: 8px 12px; background: #eff6ff; color: #1e40af; border-radius: 4px; margin-bottom: 12px; font-size: 13px; }
  `]
})
export class DocumentoFormComponent implements OnInit, OnDestroy {

  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  errorMsg = '';

  alunos: AlunoResponse[] = [];
  tipoOptions = Object.values(TipoDocumento);

  tipoLabels: Record<string, string> = {
    'DECLARACAO_MATRICULA': 'Declaração de Matrícula',
    'HISTORICO_ESCOLAR': 'Histórico Escolar',
    'DECLARACAO_FREQUENCIA': 'Declaração de Frequência'
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private documentoService: DocumentoService,
    private alunoService: AlunoService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      alunoId: [null, [Validators.required]],
      tipo: [null, [Validators.required]]
    });

    this.carregarAlunos();
  }

  private carregarAlunos(): void {
    this.loading = true;
    this.alunoService.findAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (alunos) => {
          this.alunos = alunos;
          this.loading = false;
        },
        error: () => {
          this.errorMsg = 'Erro ao carregar lista de alunos.';
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
    const request = this.form.value as DocumentoRequest;

    this.documentoService.save(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.close.emit();
        },
        error: () => {
          this.errorMsg = 'Erro ao emitir documento.';
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
