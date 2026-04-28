

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit, OnDestroy {

  form!: FormGroup;
  loading  = false;
  errorMsg = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb:          FormBuilder,
    private authService: AuthService,
    private router:      Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      login: ['', [Validators.required]],
      senha: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get login() { return this.form.get('login'); }
  get senha()  { return this.form.get('senha');  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading  = true;
    this.errorMsg = '';
    this.form.disable();

    this.authService.login(this.form.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.loading  = false;
          this.errorMsg = 'Login ou senha inválidos.';
          this.form.enable();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}