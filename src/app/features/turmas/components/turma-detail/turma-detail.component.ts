import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TurmaResponse } from '../../../../core/models/responses/turma.response';
import { TurmaService } from '../../data-access/turma.service';

export interface TurmaDetailData { turmaId: number; }

@Component({
  selector: 'app-turma-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './turma-detail.component.html',
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
export class TurmaDetailComponent implements OnInit, OnDestroy {

  turma: TurmaResponse | null = null;
  loading = false;
  errorMsg = '';

  private destroy$ = new Subject<void>();

  constructor(
    private turmaService: TurmaService,
    private dialogRef: MatDialogRef<TurmaDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TurmaDetailData
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.turmaService.findById(this.data.turmaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: t => { this.turma = t; this.loading = false; },
        error: () => { this.errorMsg = 'Erro ao carregar turma.'; this.loading = false; }
      });
  }

  fechar(): void { this.dialogRef.close(); }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
