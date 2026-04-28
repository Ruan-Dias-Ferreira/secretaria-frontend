import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { NotaResponse } from '../../../../core/models/responses/nota.response';
import { NotaService } from '../../services/nota.service';
import { NotaFormComponent } from '../nota-form/nota-form.component';

@Component({
  selector: 'app-nota-list',
  standalone: true,
  imports: [CommonModule, NotaFormComponent],
  templateUrl: './nota-list.component.html',
  styles: [`
    .container { padding: 24px; max-width: 1100px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    h1 { margin: 0; }
    button { padding: 8px 14px; border: none; border-radius: 6px; cursor: pointer; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-secondary { background: #e5e7eb; color: #111827; }
    .btn-danger { background: #dc2626; color: #fff; }
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; }
    .actions { display: flex; gap: 6px; }
    .actions button { padding: 6px 10px; font-size: 12px; }
    .empty, .loading { text-align: center; padding: 32px; color: #6b7280; }
    .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge-aprovado { background: #d1fae5; color: #065f46; }
    .badge-recuperacao { background: #fef3c7; color: #92400e; }
    .badge-reprovado { background: #fee2e2; color: #991b1b; }
    .badge-desistente { background: #f3f4f6; color: #6b7280; }
    .badge-transferido { background: #dbeafe; color: #1e40af; }
  `]
})
export class NotaListComponent implements OnInit, OnDestroy {

  notas: NotaResponse[] = [];
  loading = false;
  modalFormAberto = false;
  notaSelecionadaId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(private notaService: NotaService) {}

  ngOnInit(): void {
    this.carregarNotas();
    this.notaService.notaAtualizada$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.carregarNotas());
  }

  carregarNotas(): void {
    this.loading = true;
    this.notaService.findAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.notas = data; this.loading = false; },
        error: () => { this.loading = false; }
      });
  }

  abrirNovo(): void {
    this.notaSelecionadaId = null;
    this.modalFormAberto = true;
  }

  abrirEdicao(id: number): void {
    this.notaSelecionadaId = id;
    this.modalFormAberto = true;
  }

  fecharModal(): void {
    this.modalFormAberto = false;
    this.notaSelecionadaId = null;
  }

  excluir(id: number): void {
    if (!confirm('Excluir esta nota?')) return;
    this.notaService.delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  getSituacaoClass(situacao: string): string {
    const map: Record<string, string> = {
      'APROVADO': 'badge-aprovado',
      'RECUPERACAO': 'badge-recuperacao',
      'REPROVADO': 'badge-reprovado',
      'DESISTENTE': 'badge-desistente',
      'TRANSFERIDO': 'badge-transferido'
    };
    return map[situacao] || '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
