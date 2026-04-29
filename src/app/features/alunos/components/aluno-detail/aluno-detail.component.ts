import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AlunoResponse } from '../../../../core/models/responses/aluno.response';
import { AlunoService } from '../../services/aluno.service';

export interface AlunoDetailData { alunoId: number; }

@Component({
  selector: 'app-aluno-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
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
export class AlunoDetailComponent implements OnInit, OnDestroy {

  aluno: AlunoResponse | null = null;
  loading = false;
  errorMsg = '';

  private destroy$ = new Subject<void>();

  constructor(
    private alunoService: AlunoService,
    private dialogRef: MatDialogRef<AlunoDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AlunoDetailData
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.alunoService.findById(this.data.alunoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: a => { this.aluno = a; this.loading = false; },
        error: () => { this.errorMsg = 'Erro ao carregar aluno.'; this.loading = false; }
      });
  }

  fechar(): void { this.dialogRef.close(); }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
