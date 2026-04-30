import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styles: [`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
      background: var(--mat-sys-surface-container-low);
    }
    mat-card { width: 100%; max-width: 400px; }
    mat-card-header { justify-content: center; margin-bottom: 16px; }
    .login-icon { font-size: 48px; width: 48px; height: 48px; color: var(--mat-sys-primary); }
    form { display: flex; flex-direction: column; gap: 8px; }
    .submit-row { display: flex; justify-content: flex-end; margin-top: 16px; }
    .submit-row button { min-width: 120px; }
  `],
})
export class LoginComponent {
  private fb = inject(NonNullableFormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  protected loading = signal(false);
  protected hidePassword = signal(true);

  protected form = this.fb.group({
    login: this.fb.control('', [Validators.required]),
    senha: this.fb.control('', [Validators.required, Validators.minLength(6)]),
  });

  protected get loginCtrl() { return this.form.controls.login; }
  protected get senhaCtrl() { return this.form.controls.senha; }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.form.disable();

    this.authService.login(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: () => {
          this.loading.set(false);
          this.form.enable();
        },
      });
  }
}
