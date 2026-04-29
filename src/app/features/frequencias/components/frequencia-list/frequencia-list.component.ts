import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, finalize, takeUntil } from 'rxjs';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FrequenciaResponse } from '../../../../core/models/responses/frequencia.response';
import { FrequenciaService } from '../../services/frequencia.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Role } from '../../../../core/models/enums/role.enum';
import { FrequenciaFormComponent } from '../frequencia-form/frequencia-form.component';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-frequencia-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    FrequenciaFormComponent
  ],
  templateUrl: './frequencia-list.component.html',
  styles: [`
    table { width: 100%; }
    .actions-cell { display: flex; gap: 4px; justify-content: flex-end; }
    h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .badge {
      display: inline-block; padding: 4px 10px; border-radius: 12px;
      font-size: 12px; font-weight: 600;
    }
    .badge-presente { background: #d1fae5; color: #065f46; }
    .badge-ausente  { background: #fee2e2; color: #991b1b; }
  `]
})
export class FrequenciaListComponent implements OnInit, OnDestroy {

  frequencias: FrequenciaResponse[] = [];
  loading = false;
  modalFormAberto = false;
  frequenciaSelecionadaId: number | null = null;

  readonly displayedColumns = ['id', 'alunoId', 'disciplinaId', 'data', 'presente', 'acoes'];

  private destroy$ = new Subject<void>();

  constructor(
    private frequenciaService: FrequenciaService,
    private auth: AuthService,
    private confirmDialog: ConfirmDialogService,
    private notification: NotificationService
  ) {}

  get isSecretaria(): boolean { return this.auth.hasRole(Role.SECRETARIA); }

  ngOnInit(): void {
    this.carregar();
    this.frequenciaService.frequenciaAtualizada$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.carregar());
  }

  carregar(): void {
    this.loading = true;
    this.frequenciaService.findAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: d => { this.frequencias = d; this.loading = false; },
        error: () => { this.loading = false; }
      });
  }

  abrirNovo(): void { this.frequenciaSelecionadaId = null; this.modalFormAberto = true; }
  abrirEdicao(id: number): void { this.frequenciaSelecionadaId = id; this.modalFormAberto = true; }
  fecharModal(): void { this.modalFormAberto = false; this.frequenciaSelecionadaId = null; }

  excluir(id: number): void {
    this.confirmDialog.confirmDelete('Excluir este registro de frequência? Esta ação não pode ser desfeita.')
      .pipe(takeUntil(this.destroy$))
      .subscribe(ok => {
        if (!ok) return;
        this.frequenciaService.delete(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => this.notification.success('Frequência excluída.'));
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
