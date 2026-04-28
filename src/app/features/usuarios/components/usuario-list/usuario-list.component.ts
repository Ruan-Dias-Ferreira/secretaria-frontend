import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { UsuarioResponse } from '../../../../core/models/responses/usuario.response';
import { UsuarioService } from '../../services/usuario.service';
import { UsuarioFormComponent } from '../usuario-form/usuario-form.component';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [CommonModule, UsuarioFormComponent],
  templateUrl: './usuario-list.component.html',
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
    .badge-secretaria { background: #ede9fe; color: #5b21b6; }
    .badge-professor { background: #dbeafe; color: #1e40af; }
    .badge-aluno { background: #d1fae5; color: #065f46; }
  `]
})
export class UsuarioListComponent implements OnInit, OnDestroy {

  usuarios: UsuarioResponse[] = [];
  loading = false;
  modalFormAberto = false;
  usuarioSelecionadoId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.carregarUsuarios();
    this.usuarioService.usuarioAtualizado$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.carregarUsuarios());
  }

  carregarUsuarios(): void {
    this.loading = true;
    this.usuarioService.findAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.usuarios = data; this.loading = false; },
        error: () => { this.loading = false; }
      });
  }

  abrirNovo(): void {
    this.usuarioSelecionadoId = null;
    this.modalFormAberto = true;
  }

  abrirEdicao(id: number): void {
    this.usuarioSelecionadoId = id;
    this.modalFormAberto = true;
  }

  fecharModal(): void {
    this.modalFormAberto = false;
    this.usuarioSelecionadoId = null;
  }

  excluir(id: number, login: string): void {
    if (!confirm(`Excluir o usuário "${login}"?`)) return;
    this.usuarioService.delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  getRoleClass(role: string): string {
    const map: Record<string, string> = {
      'SECRETARIA': 'badge-secretaria',
      'PROFESSOR': 'badge-professor',
      'ALUNO': 'badge-aluno'
    };
    return map[role] || '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
