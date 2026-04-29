import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, finalize, takeUntil } from 'rxjs';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { DisciplinaResponse } from '../../../../core/models/responses/disciplina.response';
import { DisciplinaService } from '../../services/disciplina.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Role } from '../../../../core/models/enums/role.enum';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { DisciplinaFormComponent } from '../disciplina-form/disciplina-form.component';
import { DisciplinaDetailComponent, DisciplinaDetailData } from '../disciplina-detail/disciplina-detail.component';

type ModalAtivo = 'form' | null;

@Component({
  selector: 'app-disciplina-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    DisciplinaFormComponent
  ],
  templateUrl: './disciplina-list.component.html',
  styles: [`
    table { width: 100%; }
    .actions-cell { display: flex; gap: 4px; justify-content: flex-end; }
    h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .muted { color: var(--mat-sys-on-surface-variant); font-style: italic; }
  `]
})
export class DisciplinaListComponent implements OnInit, OnDestroy {

  disciplinas: DisciplinaResponse[] = [];
  loading = false;
  modalAtivo: ModalAtivo = null;
  disciplinaSelecionadaId: number | null = null;

  readonly displayedColumns = ['id', 'nome', 'cargaHoraria', 'turma', 'professor', 'acoes'];

  private destroy$ = new Subject<void>();

  constructor(
    private disciplinaService: DisciplinaService,
    private auth: AuthService,
    private dialog: MatDialog,
    private confirmDialog: ConfirmDialogService,
    private notification: NotificationService
  ) {}

  get isSecretaria(): boolean { return this.auth.hasRole(Role.SECRETARIA); }

  ngOnInit(): void {
    this.carregar();
    this.disciplinaService.disciplinaAtualizada$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.carregar());
  }

  carregar(): void {
    this.loading = true;
    this.disciplinaService.findAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: d => { this.disciplinas = d; this.loading = false; },
        error: () => { this.loading = false; }
      });
  }

  abrirNovo(): void { this.disciplinaSelecionadaId = null; this.modalAtivo = 'form'; }
  abrirEdicao(id: number): void { this.disciplinaSelecionadaId = id; this.modalAtivo = 'form'; }

  abrirDetalhe(id: number): void {
    this.dialog.open(DisciplinaDetailComponent, {
      data: { disciplinaId: id } satisfies DisciplinaDetailData
    });
  }

  fecharModal(): void { this.modalAtivo = null; this.disciplinaSelecionadaId = null; }

  excluir(id: number, nome: string): void {
    this.confirmDialog.confirmDelete(`Excluir a disciplina "${nome}"? Esta ação não pode ser desfeita.`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(ok => {
        if (!ok) return;
        this.disciplinaService.delete(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => this.notification.success('Disciplina excluída.'));
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
