import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { BoletimResponse } from '../../../../core/models/responses/boletim.response';
import { SituacaoNota } from '../../../../core/models/enums/situacao-nota.enum';
import { NotaService } from '../../../notas/data-access/nota.service';

export interface BoletimDialogData { alunoId: number; }

@Component({
  selector: 'app-boletim-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './boletim-modal.component.html',
  styles: [`
    mat-dialog-content { min-width: 640px; max-height: 70vh; }
    .loading, .empty {
      display: flex; justify-content: center;
      padding: 24px; color: var(--mat-sys-on-surface-variant);
    }
    table { width: 100%; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge-aprovado    { background: #d1fae5; color: #065f46; }
    .badge-reprovado   { background: #fee2e2; color: #991b1b; }
    .badge-recuperacao { background: #fef3c7; color: #92400e; }
    .badge-default     { background: var(--mat-sys-surface-variant); color: var(--mat-sys-on-surface-variant); }
  `]
})
export class BoletimModalComponent {

  protected boletim = signal<BoletimResponse[]>([]);
  protected loading = signal(false);
  protected errorMsg = signal('');

  readonly displayedColumns = ['disciplina', 'b1', 'b2', 'b3', 'b4', 'media', 'situacao'];

  private notaService = inject(NotaService);
  private dialogRef = inject(MatDialogRef<BoletimModalComponent>);
  protected data = inject(MAT_DIALOG_DATA) as BoletimDialogData;

  constructor() {
    this.loading.set(true);
    this.notaService.getBoletim(this.data.alunoId)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: d => { this.boletim.set(d); this.loading.set(false); },
        error: () => { this.errorMsg.set('Erro ao carregar boletim.'); this.loading.set(false); }
      });
  }

  notaPorBimestre(item: BoletimResponse, bimestre: number): number | null {
    const n = item.notaDisciplinas.find(x => x.bimestre === bimestre);
    return n ? n.valor : null;
  }

  badgeClass(s: SituacaoNota): string {
    switch (s) {
      case SituacaoNota.APROVADO:    return 'badge badge-aprovado';
      case SituacaoNota.REPROVADO:   return 'badge badge-reprovado';
      case SituacaoNota.RECUPERACAO: return 'badge badge-recuperacao';
      default:                       return 'badge badge-default';
    }
  }

  fechar(): void { this.dialogRef.close(); }
}
