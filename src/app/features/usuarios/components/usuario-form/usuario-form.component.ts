import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UsuarioRequest } from '../../../../core/models/requests/usuario.request';
import { UsuarioService } from '../../services/usuario.service';
import { Role } from '../../../../core/models/enums/role.enum';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-usuario-form',
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
  templateUrl: './usuario-form.component.html',
  styles: [`
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.45);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .dialog-card {
      background: #fff; border-radius: 12px; padding: 28px 32px;
      width: 90%; max-width: 480px; max-height: 90vh; overflow-y: auto;
      box-shadow: 0 8px 30px rgba(0,0,0,.2);
    }
    .dialog-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .dialog-title h2 { margin: 0; font-weight: 500; }
    .dialog-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
    .spinner-center { display: flex; justify-content: center; padding: 32px 0; }
  `]
})
export class UsuarioFormComponent implements OnInit, OnDestroy {

  @Input() usuarioId: number | null = null;
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  senhaVisivel = false;

  readonly roleOptions = Object.values(Role);

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      login: ['', [Validators.required, Validators.minLength(3)]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      role:  [Role.PROFESSOR, [Validators.required]]
    });

    if (this.usuarioId !== null) {
      this.carregarUsuario(this.usuarioId);
    }
  }

  get isEdicao(): boolean { return this.usuarioId !== null; }

  private carregarUsuario(id: number): void {
    this.loading = true;
    this.usuarioService.findById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: usuario => {
          this.form.patchValue({ login: usuario.login, role: usuario.role });
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    const request = this.form.value as UsuarioRequest;
    const op$ = this.isEdicao && this.usuarioId !== null
      ? this.usuarioService.update(this.usuarioId, request)
      : this.usuarioService.save(request);

    op$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notification.success(this.isEdicao ? 'Usuário atualizado.' : 'Usuário criado.');
        this.loading = false;
        this.close.emit();
      },
      error: () => { this.loading = false; }
    });
  }

  cancelar(): void { this.close.emit(); }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
