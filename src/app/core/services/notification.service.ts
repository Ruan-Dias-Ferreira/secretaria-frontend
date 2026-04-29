import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  private readonly defaultConfig: MatSnackBarConfig = {
    duration: 4000,
    horizontalPosition: 'right',
    verticalPosition: 'top'
  };

  success(message: string, duration = 3000): void {
    this.snackBar.open(message, 'OK', {
      ...this.defaultConfig,
      duration,
      panelClass: ['snackbar-success']
    });
  }

  error(message: string, duration = 5000): void {
    this.snackBar.open(message, 'Fechar', {
      ...this.defaultConfig,
      duration,
      panelClass: ['snackbar-error']
    });
  }

  info(message: string, duration = 3000): void {
    this.snackBar.open(message, 'OK', {
      ...this.defaultConfig,
      duration,
      panelClass: ['snackbar-info']
    });
  }

  warning(message: string, duration = 4000): void {
    this.snackBar.open(message, 'OK', {
      ...this.defaultConfig,
      duration,
      panelClass: ['snackbar-warning']
    });
  }
}
