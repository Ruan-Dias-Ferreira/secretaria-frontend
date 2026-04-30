import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { FrequenciaResumoResponse } from '../../../../core/models/responses/frequencia-resumo.response';
import { SituacaoFrequencia } from '../../../../core/models/enums/situacao-frequencia.enum';
import { AlunoService } from '../../data-access/aluno.service';

export interface FrequenciaDialogData { alunoId: number; }

@Component({
  selector: 'app-frequencia-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
export class FrequenciaModalComponent {

  protected frequencias = signal<FrequenciaResumoResponse[]>([]);
  protected loading = signal(false);
  protected errorMsg = signal('');

  readonly displayedColumns = ['disciplina', 'cargaHoraria', 'presencas', 'percentual', 'situacao'];

  private alunoService = inject(AlunoService);
  private dialogRef = inject(MatDialogRef<FrequenciaModalComponent>);
  protected data = inject(MAT_DIALOG_DATA) as FrequenciaDialogData;

  constructor() {
    this.loading.set(true);
    this.alunoService.getFrequencias(this.data.alunoId)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: d => { this.frequencias.set(d); this.loading.set(false); },
        error: () => { this.errorMsg.set('Erro ao carregar frequências.'); this.loading.set(false); }
      });
  }

  badgeClass(s: SituacaoFrequencia): string {
    return s === SituacaoFrequencia.REGULAR
      ? 'badge badge-regular'
      : 'badge badge-reprovado';
  }

  fechar(): void { this.dialogRef.close(); }
}
