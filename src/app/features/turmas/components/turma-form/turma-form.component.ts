import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TurmaRequest } from '../../../../core/models/requests/turma.request';
import { TurmaService } from '../../data-access/turma.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-turma-form',
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
export class TurmaFormComponent {

  readonly turmaId = input<number | null>(null);
  readonly close = output<void>();

  protected loading = signal(false);

  readonly turnos = [
    { value: 'MANHA',     label: 'Manhã' },
    { value: 'TARDE',     label: 'Tarde' },
    { value: 'NOITE',     label: 'Noite' },
    { value: 'INTEGRAL',  label: 'Integral' }
  ];

  private fb = inject(NonNullableFormBuilder);
  private turmaService = inject(TurmaService);
  private notification = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  protected form = this.fb.group({
    nome:      ['', [Validators.required, Validators.minLength(2)]],
    anoLetivo: [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2100)]],
    turno:     ['MANHA', [Validators.required]],
    curso:     ['', [Validators.required]]
  });

  get isEdicao(): boolean { return this.turmaId() !== null; }

  constructor() {
    const id = this.turmaId();
    if (id !== null) {
      this.carregarTurma(id);
    }
  }

  private carregarTurma(id: number): void {
    this.loading.set(true);
    this.turmaService.findById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: t => { this.form.patchValue(t); this.loading.set(false); },
        error: () => { this.loading.set(false); }
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const request = this.form.getRawValue() as TurmaRequest;

    const id = this.turmaId();
    const op$ = this.isEdicao && id !== null
      ? this.turmaService.update(id, request)
      : this.turmaService.save(request);

    op$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading.set(false);
        this.notification.success(this.isEdicao ? 'Turma atualizada.' : 'Turma cadastrada.');
        this.close.emit();
      },
      error: () => { this.loading.set(false); }
    });
  }

  cancelar(): void { this.close.emit(); }
}
