import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DisciplinaResponse } from '../../../../core/models/responses/disciplina.response';
import { DisciplinaService } from '../../services/disciplina.service';

export interface DisciplinaDetailData { disciplinaId: number; }

@Component({
  selector: 'app-disciplina-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './disciplina-detail.component.html',
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
    .muted { color: var(--mat-sys-on-surface-variant); font-style: italic; }
    .error { color: var(--mat-sys-error); padding: 16px 0; text-align: center; }
  `]
})
export class DisciplinaDetailComponent implements OnInit, OnDestroy {

  disciplina: DisciplinaResponse | null = null;
  loading = false;
  errorMsg = '';

  private destroy$ = new Subject<void>();

  constructor(
    private disciplinaService: DisciplinaService,
    private dialogRef: MatDialogRef<DisciplinaDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DisciplinaDetailData
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.disciplinaService.findById(this.data.disciplinaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: d => { this.disciplina = d; this.loading = false; },
        error: () => { this.errorMsg = 'Erro ao carregar disciplina.'; this.loading = false; }
      });
  }

  fechar(): void { this.dialogRef.close(); }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
