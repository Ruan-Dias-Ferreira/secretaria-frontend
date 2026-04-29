import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, finalize, takeUntil } from 'rxjs';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { NotaResponse } from '../../../../core/models/responses/nota.response';
import { NotaService } from '../../services/nota.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Role } from '../../../../core/models/enums/role.enum';
import { NotaFormComponent } from '../nota-form/nota-form.component';

@Component({
  selector: 'app-nota-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    NotaFormComponent
  ],
  templateUrl: './nota-list.component.html',
  styles: [`
    table { width: 100%; }
    .actions-cell { display: flex; gap: 4px; justify-content: flex-end; }
    h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .badge {
      display: inline-block; padding: 4px 10px; border-radius: 12px;
      font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .3px;
    }
    .badge-aprovado    { background: #d1fae5; color: #065f46; }
    .badge-recuperacao { background: #fef3c7; color: #92400e; }
    .badge-reprovado   { background: #fee2e2; color: #991b1b; }
    .badge-desistente  { background: #f3f4f6; color: #6b7280; }
    .badge-transferido { background: #dbeafe; color: #1e40af; }
  `]
})
export class NotaListComponent implements OnInit, OnDestroy {

  notas: NotaResponse[] = [];
  loading = false;
  modalFormAberto = false;
  notaSelecionadaId: number | null = null;

  readonly displayedColumns = ['id', 'alunoId', 'disciplinaId', 'bimestre', 'valor', 'situacao', 'acoes'];

  private destroy$ = new Subject<void>();

  constructor(
    private notaService: NotaService,
    private auth: AuthService,
    private confirmDialog: ConfirmDialogService,
    private notification: NotificationService
  ) {}

  get isSecretaria(): boolean { return this.auth.hasRole(Role.SECRETARIA); }

  ngOnInit(): void {
    this.carregar();
    this.notaService.notaAtualizada$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.carregar());
  }

  carregar(): void {
    this.loading = true;
    this.notaService.findAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: d => { this.notas = d; this.loading = false; },
        error: () => { this.loading = false; }
      });
  }

  abrirNovo(): void { this.notaSelecionadaId = null; this.modalFormAberto = true; }
  abrirEdicao(id: number): void { this.notaSelecionadaId = id; this.modalFormAberto = true; }
  fecharModal(): void { this.modalFormAberto = false; this.notaSelecionadaId = null; }

  excluir(id: number): void {
    this.confirmDialog.confirmDelete('Excluir esta nota? Esta ação não pode ser desfeita.')
      .pipe(takeUntil(this.destroy$))
      .subscribe(ok => {
        if (!ok) return;
        this.notaService.delete(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => this.notification.success('Nota excluída.'));
      });
  }

  getSituacaoClass(situacao: string): string {
    const map: Record<string, string> = {
      'APROVADO':    'badge-aprovado',
      'RECUPERACAO': 'badge-recuperacao',
      'REPROVADO':   'badge-reprovado',
      'DESISTENTE':  'badge-desistente',
      'TRANSFERIDO': 'badge-transferido'
    };
    return map[situacao] || '';
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
