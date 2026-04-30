import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AlunoRequest } from '../../../../core/models/requests/aluno.request';
import { AlunoService } from '../../data-access/aluno.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-aluno-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
export class AlunoFormComponent {
  readonly alunoId = input<number | null>(null);
  readonly close = output<void>();

  protected loading = signal(false);

  private fb = inject(NonNullableFormBuilder);
  private alunoService = inject(AlunoService);
  private notification = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  protected form = this.fb.group({
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

  protected isEdicao = computed(() => this.alunoId() !== null);

  constructor() {
    const id = this.alunoId();
    if (id !== null) this.carregarAluno(id);
  }

  private carregarAluno(id: number): void {
    this.loading.set(true);
    this.alunoService.findById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (aluno) => { this.form.patchValue(aluno); this.loading.set(false); },
        error: () => { this.loading.set(false); }
      });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    const request = this.form.value as AlunoRequest;
    const id = this.alunoId();
    const operacao$ = this.isEdicao() && id !== null
      ? this.alunoService.update(id, request)
      : this.alunoService.save(request);

    operacao$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading.set(false);
        this.notification.success(this.isEdicao() ? 'Aluno atualizado.' : 'Aluno cadastrado.');
        this.close.emit();
      },
      error: () => { this.loading.set(false); }
    });
  }

  cancelar(): void { this.close.emit(); }
}
