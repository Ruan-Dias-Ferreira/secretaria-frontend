import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, finalize, takeUntil } from 'rxjs';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';

import { MatriculaResponse } from '../../../../core/models/responses/matricula.response';
import { MatriculaService } from '../../services/matricula.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Role } from '../../../../core/models/enums/role.enum';
import { MatriculaFormComponent } from '../matricula-form/matricula-form.component';
import { MatriculaDetailComponent } from '../matricula-detail/matricula-detail.component';
import { StatusMatricula } from '../../../../core/models/enums/status-matricula.enum';
import { MatriculaStatusRequest } from '../../../../core/models/requests/matricula-status.request';

type ModalAtivo = 'form' | 'detail' | null;

@Component({
  selector: 'app-matricula-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatriculaFormComponent,
    MatriculaDetailComponent
  ],
  templateUrl: './matricula-list.component.html',
  styles: [`
    table { width: 100%; }
    .actions-cell { display: flex; gap: 4px; align-items: center; justify-content: flex-end; }
    h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .status-select { width: 140px; }
    .status-select.compact ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    .badge {
      display: inline-block; padding: 4px 10px; border-radius: 12px;
      font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .3px;
    }
    .badge-ativo { background: #d1fae5; color: #065f46; }
    .badge-desistente { background: #fee2e2; color: #991b1b; }
    .badge-transferido { background: #fef3c7; color: #92400e; }
    .badge-concluida { background: #dbeafe; color: #1e40af; }
  `]
})
export class MatriculaListComponent implements OnInit, OnDestroy {

  matriculas: MatriculaResponse[] = [];
  loading = false;
  modalAtivo: ModalAtivo = null;
  matriculaSelecionadaId: number | null = null;

  readonly displayedColumns = ['id', 'alunoId', 'turmaId', 'anoLetivo', 'status', 'acoes'];
  readonly statusOptions = Object.values(StatusMatricula);

  private destroy$ = new Subject<void>();

  constructor(
    private matriculaService: MatriculaService,
    private auth: AuthService,
    private confirmDialog: ConfirmDialogService,
    private notification: NotificationService
  ) {}

  get isSecretaria(): boolean { return this.auth.hasRole(Role.SECRETARIA); }

  ngOnInit(): void {
    this.carregar();
    this.matriculaService.matriculaAtualizada$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.carregar());
  }

  carregar(): void {
    this.loading = true;
    this.matriculaService.findAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: d => { this.matriculas = d; this.loading = false; },
        error: () => { this.loading = false; }
      });
  }

  abrirNovo(): void { this.matriculaSelecionadaId = null; this.modalAtivo = 'form'; }
  abrirEdicao(id: number): void { this.matriculaSelecionadaId = id; this.modalAtivo = 'form'; }
  abrirDetalhe(id: number): void { this.matriculaSelecionadaId = id; this.modalAtivo = 'detail'; }
  fecharModal(): void { this.modalAtivo = null; this.matriculaSelecionadaId = null; }

  alterarStatus(id: number, novoStatus: StatusMatricula): void {
    const request: MatriculaStatusRequest = { status: novoStatus };
    this.matriculaService.updateStatus(id, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.notification.success('Status atualizado.'));
  }

  excluir(id: number): void {
    this.confirmDialog.confirmDelete('Excluir esta matrícula? Esta ação não pode ser desfeita.')
      .pipe(takeUntil(this.destroy$))
      .subscribe(ok => {
        if (!ok) return;
        this.matriculaService.delete(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => this.notification.success('Matrícula excluída.'));
      });
  }

  getBadgeClass(status: StatusMatricula): string {
    const map: Record<StatusMatricula, string> = {
      [StatusMatricula.ATIVO]: 'badge-ativo',
      [StatusMatricula.DESISTENTE]: 'badge-desistente',
      [StatusMatricula.TRANSFERIDO]: 'badge-transferido',
      [StatusMatricula.CONCLUIDA]: 'badge-concluida'
    };
    return map[status] || '';
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
