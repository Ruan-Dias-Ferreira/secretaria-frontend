import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { BoletimResponse } from '../../../../core/models/responses/boletim.response';
import { SituacaoNota } from '../../../../core/models/enums/situacao-nota.enum';
import { NotaService } from '../../../notas/services/nota.service';

@Component({
  selector: 'app-boletim-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './boletim-modal.component.html',
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
    th, td { padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
    th { background: #f9fafb; font-weight: 600; font-size: 13px; }
    .badge { padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge-aprovado { background: #d1fae5; color: #065f46; }
    .badge-reprovado { background: #fee2e2; color: #991b1b; }
    .badge-recuperacao { background: #fef3c7; color: #92400e; }
    .badge-default { background: #e5e7eb; color: #374151; }
    .loading, .empty { text-align: center; padding: 24px; color: #6b7280; }
    .actions { display: flex; justify-content: flex-end; margin-top: 20px; }
    button { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; background: #e5e7eb; }
  `]
})
export class BoletimModalComponent implements OnInit, OnDestroy {

  @Input() alunoId!: number;
  @Output() close = new EventEmitter<void>();

  boletim: BoletimResponse[] = [];
  loading = false;
  errorMsg = '';

  private destroy$ = new Subject<void>();

  constructor(private notaService: NotaService) {}

  ngOnInit(): void {
    this.carregarBoletim();
  }

  private carregarBoletim(): void {
    this.loading = true;
    this.notaService.getBoletim(this.alunoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.boletim = data;
          this.loading = false;
        },
        error: () => {
          this.errorMsg = 'Erro ao carregar boletim.';
          this.loading = false;
        }
      });
  }

  notaPorBimestre(item: BoletimResponse, bimestre: number): number | null {
    const nota = item.notaDisciplinas.find(n => n.bimestre === bimestre);
    return nota ? nota.valor : null;
  }

  badgeClass(situacao: SituacaoNota): string {
    switch (situacao) {
      case SituacaoNota.APROVADO: return 'badge badge-aprovado';
      case SituacaoNota.REPROVADO: return 'badge badge-reprovado';
      case SituacaoNota.RECUPERACAO: return 'badge badge-recuperacao';
      default: return 'badge badge-default';
    }
  }

  fechar(): void {
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
