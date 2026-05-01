import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

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
import { DisciplinaService } from '../../data-access/disciplina.service';
import { TurmaService } from '../../../turmas/data-access/turma.service';
import { UsuarioService } from '../../../usuarios/data-access/usuario.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-disciplina-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
export class DisciplinaFormComponent {

  readonly disciplinaId = input<number | null>(null);
  readonly close = output<void>();

  protected loading = signal(false);
  protected turmas = signal<TurmaResponse[]>([]);
  protected professores = signal<UsuarioResponse[]>([]);

  private fb = inject(NonNullableFormBuilder);
  private disciplinaService = inject(DisciplinaService);
  private turmaService = inject(TurmaService);
  private usuarioService = inject(UsuarioService);
  private notification = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  protected form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    cargaHoraria: [40, [Validators.required, Validators.min(1), Validators.max(2000)]],
    turmaId: [null as number | null, [Validators.required]],
    professorId: [null as number | null]
  });

  get isEdicao(): boolean { return this.disciplinaId() !== null; }

  constructor() {
    this.carregarDropdowns();
  }

  private carregarDropdowns(): void {
    this.loading.set(true);
    forkJoin({
      turmas: this.turmaService.findAll(),
      usuarios: this.usuarioService.findAll()
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: ({ turmas, usuarios }) => {
        this.turmas.set(turmas.filter(t => t.operavel));
        this.professores.set(usuarios.filter(u => u.role === Role.PROFESSOR));
        const id = this.disciplinaId();
        if (id !== null) {
          this.carregarDisciplina(id);
        } else {
          this.loading.set(false);
        }
      },
      error: () => { this.loading.set(false); }
    });
  }

  private carregarDisciplina(id: number): void {
    this.disciplinaService.findById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: d => {
          this.form.patchValue({
            nome: d.nome,
            cargaHoraria: d.cargaHoraria,
            turmaId: d.turmaId,
            professorId: d.professorId
          });
          this.loading.set(false);
        },
        error: () => { this.loading.set(false); }
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const raw = this.form.getRawValue();
    const request: DisciplinaRequest = {
      nome: raw.nome,
      cargaHoraria: raw.cargaHoraria,
      turmaId: raw.turmaId!,
      professorId: raw.professorId ?? undefined
    };

    const id = this.disciplinaId();
    const op$ = this.isEdicao && id !== null
      ? this.disciplinaService.update(id, request)
      : this.disciplinaService.save(request);

    op$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading.set(false);
        this.notification.success(this.isEdicao ? 'Disciplina atualizada.' : 'Disciplina cadastrada.');
        this.close.emit();
      },
      error: () => { this.loading.set(false); }
    });
  }

  cancelar(): void { this.close.emit(); }
}
