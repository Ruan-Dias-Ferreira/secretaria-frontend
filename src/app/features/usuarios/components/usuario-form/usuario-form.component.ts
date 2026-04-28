import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { UsuarioRequest } from '../../../../core/models/requests/usuario.request';
import { UsuarioService } from '../../services/usuario.service';
import { Role } from '../../../../core/models/enums/role.enum';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuario-form.component.html',
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
export class UsuarioFormComponent implements OnInit, OnDestroy {

  @Input() usuarioId: number | null = null;
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  errorMsg = '';

  roleOptions = Object.values(Role);

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      login: ['', [Validators.required, Validators.minLength(3)]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      role: [Role.PROFESSOR, [Validators.required]]
    });

    if (this.usuarioId !== null) {
      this.carregarUsuario(this.usuarioId);
    }
  }

  get isEdicao(): boolean {
    return this.usuarioId !== null;
  }

  private carregarUsuario(id: number): void {
    this.loading = true;
    this.usuarioService.findById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuario) => {
          this.form.patchValue({
            login: usuario.login,
            role: usuario.role
          });
          this.loading = false;
        },
        error: () => {
          this.errorMsg = 'Erro ao carregar dados do usuário.';
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
    const request = this.form.value as UsuarioRequest;

    const operacao$ = this.isEdicao && this.usuarioId !== null
      ? this.usuarioService.update(this.usuarioId, request)
      : this.usuarioService.save(request);

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
