import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AnoLetivoService } from '../services/ano-letivo.service';

const SKIP_PATHS = ['/auth/login', '/auth/register'];

export const anoLetivoInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') return next(req);
  if (SKIP_PATHS.some(p => req.url.includes(p))) return next(req);
  if (req.params.has('ano') || req.params.has('semestre')) return next(req);

  const svc = inject(AnoLetivoService);
  const params = req.params
    .set('ano', String(svc.ano()))
    .set('semestre', String(svc.semestre()));

  return next(req.clone({ params }));
};
