import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AlunoResponse } from '../../../../core/models/responses/aluno.response';
import { AlunoService } from '../../data-access/aluno.service';

export interface AlunoDetailData { alunoId: number; }

@Component({
  selector: 'app-aluno-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './aluno-detail.component.html',
  styles: [`
    mat-dialog-content { min-width: 360px; }
    .loading { display: flex; justify-content: center; padding: 24px; }
    dl { margin: 0; }
    dt {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
      text-transform: uppercase;
      letter-spacing: .5px;
      margin-top: 12px;
    }
    dd { margin: 4px 0 0 0; font-size: 15px; color: var(--mat-sys-on-surface); }
    .error { color: var(--mat-sys-error); padding: 16px 0; text-align: center; }
  `]
})
export class AlunoDetailComponent {

  protected aluno = signal<AlunoResponse | null>(null);
  protected loading = signal(false);
  protected errorMsg = signal('');

  private alunoService = inject(AlunoService);
  private dialogRef = inject(MatDialogRef<AlunoDetailComponent>);
  protected data = inject(MAT_DIALOG_DATA) as AlunoDetailData;

  constructor() {
    this.loading.set(true);
    this.alunoService.findById(this.data.alunoId)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: a => { this.aluno.set(a); this.loading.set(false); },
        error: () => { this.errorMsg.set('Erro ao carregar aluno.'); this.loading.set(false); }
      });
  }

  fechar(): void { this.dialogRef.close(); }
}
