import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, finalize, takeUntil } from 'rxjs';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { TurmaResponse } from '../../../../core/models/responses/turma.response';
import { TurmaService } from '../../services/turma.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Role } from '../../../../core/models/enums/role.enum';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TurmaFormComponent } from '../turma-form/turma-form.component';
import { TurmaDetailComponent, TurmaDetailData } from '../turma-detail/turma-detail.component';

type ModalAtivo = 'form' | null;

@Component({
  selector: 'app-turma-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    TurmaFormComponent
  ],
  templateUrl: './turma-list.component.html',
  styles: [`
    table { width: 100%; }
    .actions-cell { display: flex; gap: 4px; justify-content: flex-end; }
    h1 { margin: 0; font-size: 24px; font-weight: 500; }
  `]
})
export class TurmaListComponent implements OnInit, OnDestroy {

  turmas: TurmaResponse[] = [];
  loading = false;
  modalAtivo: ModalAtivo = null;
  turmaSelecionadaId: number | null = null;

  readonly displayedColumns = ['id', 'nome', 'anoLetivo', 'turno', 'curso', 'acoes'];

  private destroy$ = new Subject<void>();

  constructor(
    private turmaService: TurmaService,
    private auth: AuthService,
    private dialog: MatDialog,
    private confirmDialog: ConfirmDialogService,
    private notification: NotificationService
  ) {}

  get isSecretaria(): boolean { return this.auth.hasRole(Role.SECRETARIA); }

  ngOnInit(): void {
    this.carregar();
    this.turmaService.turmaAtualizada$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.carregar());
  }

  carregar(): void {
    this.loading = true;
    this.turmaService.findAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: d => { this.turmas = d; this.loading = false; },
        error: () => { this.loading = false; }
      });
  }

  abrirNovo(): void { this.turmaSelecionadaId = null; this.modalAtivo = 'form'; }
  abrirEdicao(id: number): void { this.turmaSelecionadaId = id; this.modalAtivo = 'form'; }

  abrirDetalhe(id: number): void {
    this.dialog.open(TurmaDetailComponent, {
      data: { turmaId: id } satisfies TurmaDetailData
    });
  }

  fecharModal(): void { this.modalAtivo = null; this.turmaSelecionadaId = null; }

  excluir(id: number, nome: string): void {
    this.confirmDialog.confirmDelete(`Excluir a turma "${nome}"? Esta ação não pode ser desfeita.`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(ok => {
        if (!ok) return;
        this.turmaService.delete(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => this.notification.success('Turma excluída.'));
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
