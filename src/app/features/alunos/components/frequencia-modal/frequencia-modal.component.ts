import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { FrequenciaResumoResponse } from '../../../../core/models/responses/frequencia-resumo.response';
import { SituacaoFrequencia } from '../../../../core/models/enums/situacao-frequencia.enum';
import { AlunoService } from '../../services/aluno.service';

export interface FrequenciaDialogData { alunoId: number; }

@Component({
  selector: 'app-frequencia-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './frequencia-modal.component.html',
  styles: [`
    mat-dialog-content { min-width: 560px; max-height: 70vh; }
    .loading, .empty {
      display: flex; justify-content: center;
      padding: 24px; color: var(--mat-sys-on-surface-variant);
    }
    table { width: 100%; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge-regular   { background: #d1fae5; color: #065f46; }
    .badge-reprovado { background: #fee2e2; color: #991b1b; }
  `]
})
export class FrequenciaModalComponent implements OnInit, OnDestroy {

  frequencias: FrequenciaResumoResponse[] = [];
  loading = false;
  errorMsg = '';

  readonly displayedColumns = ['disciplina', 'cargaHoraria', 'presencas', 'percentual', 'situacao'];

  private destroy$ = new Subject<void>();

  constructor(
    private alunoService: AlunoService,
    private dialogRef: MatDialogRef<FrequenciaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FrequenciaDialogData
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.alunoService.getFrequencias(this.data.alunoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: d => { this.frequencias = d; this.loading = false; },
        error: () => { this.errorMsg = 'Erro ao carregar frequências.'; this.loading = false; }
      });
  }

  badgeClass(s: SituacaoFrequencia): string {
    return s === SituacaoFrequencia.REGULAR
      ? 'badge badge-regular'
      : 'badge badge-reprovado';
  }

  fechar(): void { this.dialogRef.close(); }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
