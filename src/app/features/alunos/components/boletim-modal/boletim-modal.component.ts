import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { BoletimResponse } from '../../../../core/models/responses/boletim.response';
import { SituacaoNota } from '../../../../core/models/enums/situacao-nota.enum';
import { NotaService } from '../../../notas/services/nota.service';

export interface BoletimDialogData { alunoId: number; }

@Component({
  selector: 'app-boletim-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule
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
export class BoletimModalComponent implements OnInit, OnDestroy {

  boletim: BoletimResponse[] = [];
  loading = false;
  errorMsg = '';

  readonly displayedColumns = ['disciplina', 'b1', 'b2', 'b3', 'b4', 'media', 'situacao'];

  private destroy$ = new Subject<void>();

  constructor(
    private notaService: NotaService,
    private dialogRef: MatDialogRef<BoletimModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BoletimDialogData
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.notaService.getBoletim(this.data.alunoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: d => { this.boletim = d; this.loading = false; },
        error: () => { this.errorMsg = 'Erro ao carregar boletim.'; this.loading = false; }
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

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
