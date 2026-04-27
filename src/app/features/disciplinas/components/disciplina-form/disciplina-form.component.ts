import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, forkJoin, takeUntil } from 'rxjs';

import { DisciplinaRequest } from '../../../../core/models/requests/disciplina.request';
import { TurmaResponse } from '../../../../core/models/responses/turma.response';
import { UsuarioResponse } from '../../../../core/models/responses/usuario.response';
import { Role } from '../../../../core/models/enums/role.enum';
import { DisciplinaService } from '../../services/disciplina.service';
import { TurmaService } from '../../../turmas/services/turma.service';
import { UsuarioService } from '../../../usuarios/services/usuario.service';

@Component({
  selector: 'app-disciplina-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './disciplina-form.component.html',
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
export class DisciplinaFormComponent implements OnInit, OnDestroy {

  @Input() disciplinaId: number | null = null;
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  errorMsg = '';

  turmas: TurmaResponse[] = [];
  professores: UsuarioResponse[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private disciplinaService: DisciplinaService,
    private turmaService: TurmaService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      cargaHoraria: [40, [Validators.required, Validators.min(1), Validators.max(2000)]],
      turmaId: [null, [Validators.required]],
      professorId: [null]
    });

    this.carregarDropdowns();
  }

  get isEdicao(): boolean {
    return this.disciplinaId !== null;
  }

  private carregarDropdowns(): void {
    this.loading = true;
    forkJoin({
      turmas: this.turmaService.findAll(),
      usuarios: this.usuarioService.findAll()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ turmas, usuarios }) => {
        this.turmas = turmas;
        this.professores = usuarios.filter(u => u.role === Role.PROFESSOR);
        if (this.disciplinaId !== null) {
          this.carregarDisciplina(this.disciplinaId);
        } else {
          this.loading = false;
        }
      },
      error: () => {
        this.errorMsg = 'Erro ao carregar opções de turma/professor.';
        this.loading = false;
      }
    });
  }

  private carregarDisciplina(id: number): void {
    this.disciplinaService.findById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (disciplina) => {
          this.form.patchValue({
            nome: disciplina.nome,
            cargaHoraria: disciplina.cargaHoraria,
            turmaId: disciplina.turmaId,
            professorId: disciplina.professorId
          });
          this.loading = false;
        },
        error: () => {
          this.errorMsg = 'Erro ao carregar dados da disciplina.';
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
    const raw = this.form.value;
    const request: DisciplinaRequest = {
      nome: raw.nome,
      cargaHoraria: raw.cargaHoraria,
      turmaId: raw.turmaId,
      professorId: raw.professorId ?? undefined
    };

    const operacao$ = this.isEdicao && this.disciplinaId !== null
      ? this.disciplinaService.update(this.disciplinaId, request)
      : this.disciplinaService.save(request);

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
