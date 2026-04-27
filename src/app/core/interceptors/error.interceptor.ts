// src/app/core/interceptors/error.interceptor.ts

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ErrorResponse } from '../models/responses/error.response';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  return next(req).pipe(
    catchError((httpError: HttpErrorResponse) => {
      const body = httpError.error as ErrorResponse;

      switch (httpError.status) {
        case 401:
          authService.logout();
          router.navigate(['/auth/login']);
          break;

        case 403:
          showError(body?.message ?? 'Acesso negado.');
          break;

        case 404:
          showError(body?.message ?? 'Recurso não encontrado.');
          break;

        case 400:
        case 409:
          if (body?.errors?.length > 0) {
            showError(body.errors.join(' | '));
          } else {
            showError(body?.message ?? 'Requisição inválida.');
          }
          break;

        case 500:
          showError('Erro interno — contate o suporte.');
          break;

        case 0:
          showError('Sem conexão com o servidor.');
          break;

        default:
          showError('Ocorreu um erro inesperado.');
      }

      return throwError(() => httpError);
    })
  );
};

function showError(message: string): void {
  alert(message); 
}