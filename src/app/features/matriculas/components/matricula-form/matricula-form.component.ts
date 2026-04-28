import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, Subject, takeUntil } from 'rxjs';

import { MatriculaRequest } from '../../../../core/models/requests/matricula.request';
import { MatriculaService } from '../../services/matricula.service';
import { AlunoService } from '../../../alunos/services/aluno.service';
import { TurmaService } from '../../../turmas/services/turma.service';
import { AlunoResponse } from '../../../../core/models/responses/aluno.response';
import { TurmaResponse } from '../../../../core/models/responses/turma.response';
import { StatusMatricula } from '../../../../core/models/enums/status-matricula.enum';

@Component({
  selector: 'app-matricula-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './matricula-form.component.html',
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
export class MatriculaFormComponent implements OnInit, OnDestroy {

  @Input() matriculaId: number | null = null;
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  errorMsg = '';

  alunos: AlunoResponse[] = [];
  turmas: TurmaResponse[] = [];
  statusOptions = Object.values(StatusMatricula);

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private matriculaService: MatriculaService,
    private alunoService: AlunoService,
    private turmaService: TurmaService
  ) {}

  ngOnInit(): void {
    const anoAtual = new Date().getFullYear();
    this.form = this.fb.group({
      alunoId: [null, [Validators.required]],
      turmaId: [null, [Validators.required]],
      anoLetivo: [anoAtual, [Validators.required, Validators.min(2000), Validators.max(2100)]],
      status: [StatusMatricula.ATIVO, [Validators.required]]
    });

    this.carregarDropdowns();
  }

  get isEdicao(): boolean {
    return this.matriculaId !== null;
  }

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
        error: () => {
          this.errorMsg = 'Erro ao carregar dados para o formulário.';
          this.loading = false;
        }
      });
  }

  private carregarMatricula(id: number): void {
    this.matriculaService.findById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (matricula) => {
          this.form.patchValue(matricula);
          this.loading = false;
        },
        error: () => {
          this.errorMsg = 'Erro ao carregar dados da matrícula.';
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
    const request = this.form.value as MatriculaRequest;

    const operacao$ = this.isEdicao && this.matriculaId !== null
      ? this.matriculaService.update(this.matriculaId, request)
      : this.matriculaService.save(request);

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
