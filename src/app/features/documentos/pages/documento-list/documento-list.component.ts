import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DocumentoResponse } from '../../../../core/models/responses/documento.response';
import { DocumentoService } from '../../data-access/documento.service';
import { DocumentoFormComponent } from '../../components/documento-form/documento-form.component';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';

const TIPO_LABELS: Record<string, string> = {
  DECLARACAO_MATRICULA:  'Declaração de Matrícula',
  HISTORICO_ESCOLAR:     'Histórico Escolar',
  DECLARACAO_FREQUENCIA: 'Declaração de Frequência'
};

@Component({
  selector: 'app-documento-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    DocumentoFormComponent
  ],
  templateUrl: './documento-list.component.html',
  styles: [`
    table { width: 100%; }
    .actions-cell { display: flex; gap: 4px; justify-content: flex-end; }
    h1 { margin: 0; font-size: 24px; font-weight: 500; }
  `]
})
export class DocumentoListComponent implements OnInit {

  protected documentos = signal<DocumentoResponse[]>([]);
  protected loading = signal(false);
  protected modalFormAberto = signal(false);

  readonly displayedColumns = ['id', 'alunoId', 'tipo', 'dataEmissao', 'acoes'];

  private documentoService = inject(DocumentoService);
  private confirmDialog = inject(ConfirmDialogService);
  private notification = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.carregar();
    this.documentoService.documentoAtualizado$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.carregar());
  }

  carregar(): void {
    this.loading.set(true);
    this.documentoService.findAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: d => { this.documentos.set(d); this.loading.set(false); },
        error: () => { this.loading.set(false); }
      });
  }

  abrirNovo(): void { this.modalFormAberto.set(true); }
  fecharModal(): void { this.modalFormAberto.set(false); }

  excluir(id: number): void {
    this.confirmDialog.confirmDelete('Excluir este documento? Esta ação não pode ser desfeita.')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(ok => {
        if (!ok) return;
        this.documentoService.delete(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.notification.success('Documento excluído.'));
      });
  }

  getTipoLabel(tipo: string): string {
    return TIPO_LABELS[tipo] || tipo;
  }

  baixarPdf(doc: DocumentoResponse): void {
    const tipoLabel = this.getTipoLabel(doc.tipo as string);
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${tipoLabel}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 700px; margin: 60px auto; color: #111; }
    h1 { font-size: 20px; text-align: center; }
    h2 { font-size: 18px; text-align: center; color: #444; }
    .meta { text-align: center; color: #666; margin-bottom: 40px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    td { padding: 10px 4px; border-bottom: 1px solid #eee; font-size: 15px; }
    td:first-child { font-weight: 600; width: 200px; }
    .footer { margin-top: 60px; text-align: center; color: #888; font-size: 12px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>Secretaria Escolar</h1>
  <h2>${tipoLabel}</h2>
  <div class="meta">Documento Nº ${doc.id}</div>
  <table>
    <tr><td>Tipo:</td><td>${tipoLabel}</td></tr>
    <tr><td>Aluno (ID):</td><td>${doc.alunoId}</td></tr>
    <tr><td>Data de Emissão:</td><td>${doc.dataEmissao}</td></tr>
  </table>
  <div class="footer">Documento gerado em ${new Date().toLocaleDateString('pt-BR')}</div>
  <script>window.onload = function(){ window.print(); }</script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }
}
