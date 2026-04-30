import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../shared/ui/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly dialog = inject(MatDialog);

  confirm(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
        ConfirmDialogComponent,
        { data, autoFocus: false, restoreFocus: true }
      )
      .afterClosed() as Observable<boolean>;
  }

  confirmDelete(message: string, title = 'Confirmar exclusão'): Observable<boolean> {
    return this.confirm({
      title,
      message,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      destructive: true
    });
  }
}
