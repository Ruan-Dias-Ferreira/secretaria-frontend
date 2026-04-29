import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, forkJoin, takeUntil } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DisciplinaRequest } from '../../../../core/models/requests/disciplina.request';
import { TurmaResponse } from '../../../../core/models/responses/turma.response';
import { UsuarioResponse } from '../../../../core/models/responses/usuario.response';
import { Role } from '../../../../core/models/enums/role.enum';
import { DisciplinaService } from '../../services/disciplina.service';
import { TurmaService } from '../../../turmas/services/turma.service';
import { UsuarioService } from '../../../usuarios/services/usuario.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-disciplina-form',
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
  templateUrl: './disciplina-form.component.html',
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
export class DisciplinaFormComponent implements OnInit, OnDestroy {

  @Input() disciplinaId: number | null = null;
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;

  turmas: TurmaResponse[] = [];
  professores: UsuarioResponse[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private disciplinaService: DisciplinaService,
    private turmaService: TurmaService,
    private usuarioService: UsuarioService,
    private notification: NotificationService
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

  get isEdicao(): boolean { return this.disciplinaId !== null; }

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
      error: () => { this.loading = false; }
    });
  }

  private carregarDisciplina(id: number): void {
    this.disciplinaService.findById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: d => {
          this.form.patchValue({
            nome: d.nome,
            cargaHoraria: d.cargaHoraria,
            turmaId: d.turmaId,
            professorId: d.professorId
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
    const raw = this.form.value;
    const request: DisciplinaRequest = {
      nome: raw.nome,
      cargaHoraria: raw.cargaHoraria,
      turmaId: raw.turmaId,
      professorId: raw.professorId ?? undefined
    };

    const op$ = this.isEdicao && this.disciplinaId !== null
      ? this.disciplinaService.update(this.disciplinaId, request)
      : this.disciplinaService.save(request);

    op$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loading = false;
        this.notification.success(this.isEdicao ? 'Disciplina atualizada.' : 'Disciplina cadastrada.');
        this.close.emit();
      },
      error: () => { this.loading = false; }
    });
  }

  cancelar(): void { this.close.emit(); }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
