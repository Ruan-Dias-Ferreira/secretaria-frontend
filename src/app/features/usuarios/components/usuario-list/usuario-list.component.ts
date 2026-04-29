import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, finalize, takeUntil } from 'rxjs';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { UsuarioResponse } from '../../../../core/models/responses/usuario.response';
import { UsuarioService } from '../../services/usuario.service';
import { UsuarioFormComponent } from '../usuario-form/usuario-form.component';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    UsuarioFormComponent
  ],
  templateUrl: './usuario-list.component.html',
  styles: [`
    table { width: 100%; }
    .actions-cell { display: flex; gap: 4px; justify-content: flex-end; }
    h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .badge {
      display: inline-block; padding: 4px 10px; border-radius: 12px;
      font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .3px;
    }
    .badge-secretaria { background: #ede9fe; color: #5b21b6; }
    .badge-professor   { background: #dbeafe; color: #1e40af; }
    .badge-aluno       { background: #d1fae5; color: #065f46; }
  `]
})
export class UsuarioListComponent implements OnInit, OnDestroy {

  usuarios: UsuarioResponse[] = [];
  loading = false;
  modalFormAberto = false;
  usuarioSelecionadoId: number | null = null;

  readonly displayedColumns = ['id', 'login', 'role', 'acoes'];

  private destroy$ = new Subject<void>();

  constructor(
    private usuarioService: UsuarioService,
    private confirmDialog: ConfirmDialogService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.carregar();
    this.usuarioService.usuarioAtualizado$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.carregar());
  }

  carregar(): void {
    this.loading = true;
    this.usuarioService.findAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: d => { this.usuarios = d; this.loading = false; },
        error: () => { this.loading = false; }
      });
  }

  abrirNovo(): void { this.usuarioSelecionadoId = null; this.modalFormAberto = true; }
  abrirEdicao(id: number): void { this.usuarioSelecionadoId = id; this.modalFormAberto = true; }
  fecharModal(): void { this.modalFormAberto = false; this.usuarioSelecionadoId = null; }

  excluir(id: number, login: string): void {
    this.confirmDialog.confirmDelete(`Excluir o usuário "${login}"? Esta ação não pode ser desfeita.`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(ok => {
        if (!ok) return;
        this.usuarioService.delete(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => this.notification.success(`Usuário "${login}" excluído.`));
      });
  }

  getRoleClass(role: string): string {
    const map: Record<string, string> = {
      SECRETARIA: 'badge-secretaria',
      PROFESSOR:  'badge-professor',
      ALUNO:      'badge-aluno'
    };
    return map[role] || '';
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
