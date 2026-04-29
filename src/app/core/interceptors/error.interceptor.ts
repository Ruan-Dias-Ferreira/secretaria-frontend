// src/app/core/interceptors/error.interceptor.ts

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { ErrorResponse } from '../models/responses/error.response';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService  = inject(AuthService);
  const router       = inject(Router);
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((httpError: HttpErrorResponse) => {
      const body = httpError.error as ErrorResponse;

      switch (httpError.status) {
        case 401:
          authService.logout();
          router.navigate(['/auth/login']);
          notification.warning('Sessão expirada. Faça login novamente.');
          break;

        case 403:
          notification.error(body?.message ?? 'Acesso negado.');
          break;

        case 404:
          notification.error(body?.message ?? 'Recurso não encontrado.');
          break;

        case 400:
        case 409:
          if (body?.errors?.length > 0) {
            notification.error(body.errors.join(' | '));
          } else {
            notification.error(body?.message ?? 'Requisição inválida.');
          }
          break;

        case 500:
          notification.error('Erro interno — contate o suporte.');
          break;

        case 0:
          notification.error('Sem conexão com o servidor.');
          break;

        default:
          notification.error('Ocorreu um erro inesperado.');
      }

      return throwError(() => httpError);
    })
  );
};
