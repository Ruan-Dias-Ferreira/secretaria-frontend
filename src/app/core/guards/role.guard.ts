

import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/enums/role.enum';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  const allowedRoles: Role[] = route.data['roles'] ?? [];

  const hasPermission = allowedRoles.some(role => authService.hasRole(role));

  if (hasPermission) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};