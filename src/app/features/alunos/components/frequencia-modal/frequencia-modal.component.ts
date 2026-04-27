import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { FrequenciaResumoResponse } from '../../../../core/models/responses/frequencia-resumo.response';
import { SituacaoFrequencia } from '../../../../core/models/enums/situacao-frequencia.enum';
import { AlunoService } from '../../services/aluno.service';

@Component({
  selector: 'app-frequencia-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './frequencia-modal.component.html',
  styles: [`
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.5);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal {
      background: #fff; border-radius: 8px; padding: 24px;
      width: 90%; max-width: 700px; max-height: 90vh; overflow-y: auto;
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .modal-header h2 { margin: 0; }
    .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: left; font-size: 14px; }
    th { background: #f9fafb; font-weight: 600; }
    .badge { padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge-regular { background: #d1fae5; color: #065f46; }
    .badge-reprovado { background: #fee2e2; color: #991b1b; }
    .loading, .empty { text-align: center; padding: 24px; color: #6b7280; }
    .actions { display: flex; justify-content: flex-end; margin-top: 20px; }
    button { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; background: #e5e7eb; }
  `]
})
export class FrequenciaModalComponent implements OnInit, OnDestroy {

  @Input() alunoId!: number;
  @Output() close = new EventEmitter<void>();

  frequencias: FrequenciaResumoResponse[] = [];
  loading = false;
  errorMsg = '';

  private destroy$ = new Subject<void>();

  constructor(private alunoService: AlunoService) {}

  ngOnInit(): void {
    this.loading = true;
    this.alunoService.getFrequencias(this.alunoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.frequencias = data;
          this.loading = false;
        },
        error: () => {
          this.errorMsg = 'Erro ao carregar frequências.';
          this.loading = false;
        }
      });
  }

  badgeClass(situacao: SituacaoFrequencia): string {
    return situacao === SituacaoFrequencia.REGULAR
      ? 'badge badge-regular'
      : 'badge badge-reprovado';
  }

  fechar(): void {
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
