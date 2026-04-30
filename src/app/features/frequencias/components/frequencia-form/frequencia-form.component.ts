import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { FrequenciaRequest } from '../../../../core/models/requests/frequencia.request';
import { FrequenciaService } from '../../data-access/frequencia.service';
import { AlunoService } from '../../../alunos/data-access/aluno.service';
import { DisciplinaService } from '../../../disciplinas/data-access/disciplina.service';
import { AlunoResponse } from '../../../../core/models/responses/aluno.response';
import { DisciplinaResponse } from '../../../../core/models/responses/disciplina.response';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-frequencia-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
export class FrequenciaFormComponent implements OnInit {

  readonly frequenciaId = input<number | null>(null);
  readonly close = output<void>();

  private fb = inject(NonNullableFormBuilder);
  private frequenciaService = inject(FrequenciaService);
  private alunoService = inject(AlunoService);
  private disciplinaService = inject(DisciplinaService);
  private notification = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  protected loading = signal(false);
  protected alunos = signal<AlunoResponse[]>([]);
  protected disciplinas = signal<DisciplinaResponse[]>([]);

  readonly form = this.fb.group({
    alunoId:      this.fb.control<number | null>(null, [Validators.required]),
    disciplinaId: this.fb.control<number | null>(null, [Validators.required]),
    data:         ['', [Validators.required]],
    presente:     [true]
  });

  get isEdicao(): boolean { return this.frequenciaId() !== null; }

  ngOnInit(): void {
    const hoje = new Date().toISOString().substring(0, 10);
    this.form.patchValue({ data: hoje });
    this.carregarDropdowns();
  }

  private carregarDropdowns(): void {
    this.loading.set(true);
    forkJoin({
      alunos:      this.alunoService.findAll(),
      disciplinas: this.disciplinaService.findAll()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ alunos, disciplinas }) => {
          this.alunos.set(alunos);
          this.disciplinas.set(disciplinas);
          const id = this.frequenciaId();
          if (id !== null) {
            this.carregarFrequencia(id);
          } else {
            this.loading.set(false);
          }
        },
        error: () => { this.loading.set(false); }
      });
  }

  private carregarFrequencia(id: number): void {
    this.frequenciaService.findById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: freq => { this.form.patchValue(freq); this.loading.set(false); },
        error: () => { this.loading.set(false); }
      });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const request = this.form.getRawValue() as unknown as FrequenciaRequest;
    const id = this.frequenciaId();
    const op$ = this.isEdicao && id !== null
      ? this.frequenciaService.update(id, request)
      : this.frequenciaService.save(request);

    op$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notification.success(this.isEdicao ? 'Frequência atualizada.' : 'Frequência registrada.');
        this.loading.set(false);
        this.close.emit();
      },
      error: () => { this.loading.set(false); }
    });
  }

  cancelar(): void { this.close.emit(); }
}
