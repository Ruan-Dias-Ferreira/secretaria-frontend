import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { DocumentoResponse } from '../../../../core/models/responses/documento.response';
import { DocumentoService } from '../../services/documento.service';
import { DocumentoFormComponent } from '../documento-form/documento-form.component';

@Component({
  selector: 'app-documento-list',
  standalone: true,
  imports: [CommonModule, DocumentoFormComponent],
  templateUrl: './documento-list.component.html',
  styles: [`
    .container { padding: 24px; max-width: 1100px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    h1 { margin: 0; }
    button { padding: 8px 14px; border: none; border-radius: 6px; cursor: pointer; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-danger { background: #dc2626; color: #fff; }
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; }
    .actions { display: flex; gap: 6px; }
    .actions button { padding: 6px 10px; font-size: 12px; }
    .empty, .loading { text-align: center; padding: 32px; color: #6b7280; }
  `]
})
export class DocumentoListComponent implements OnInit, OnDestroy {

  documentos: DocumentoResponse[] = [];
  loading = false;
  modalFormAberto = false;

  private destroy$ = new Subject<void>();

  constructor(private documentoService: DocumentoService) {}

  ngOnInit(): void {
    this.carregarDocumentos();
    this.documentoService.documentoAtualizado$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.carregarDocumentos());
  }

  carregarDocumentos(): void {
    this.loading = true;
    this.documentoService.findAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.documentos = data; this.loading = false; },
        error: () => { this.loading = false; }
      });
  }

  abrirNovo(): void {
    this.modalFormAberto = true;
  }

  fecharModal(): void {
    this.modalFormAberto = false;
  }

  excluir(id: number): void {
    if (!confirm('Excluir este documento?')) return;
    this.documentoService.delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  formatarTipo(tipo: string): string {
    const map: Record<string, string> = {
      'DECLARACAO_MATRICULA': 'Declaração de Matrícula',
      'HISTORICO_ESCOLAR': 'Histórico Escolar',
      'DECLARACAO_FREQUENCIA': 'Declaração de Frequência'
    };
    return map[tipo] || tipo;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
