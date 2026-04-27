import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { TurmaResponse } from '../../../../core/models/responses/turma.response';
import { TurmaService } from '../../services/turma.service';
import { TurmaFormComponent } from '../turma-form/turma-form.component';
import { TurmaDetailComponent } from '../turma-detail/turma-detail.component';

type ModalAtivo = 'form' | 'detail' | null;

@Component({
  selector: 'app-turma-list',
  standalone: true,
  imports: [CommonModule, TurmaFormComponent, TurmaDetailComponent],
  templateUrl: './turma-list.component.html',
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
  `]
})
export class TurmaListComponent implements OnInit, OnDestroy {

  turmas: TurmaResponse[] = [];
  loading = false;
  modalAtivo: ModalAtivo = null;
  turmaSelecionadaId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(private turmaService: TurmaService) {}

  ngOnInit(): void {
    this.carregarTurmas();
    this.turmaService.turmaAtualizada$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.carregarTurmas());
  }

  carregarTurmas(): void {
    this.loading = true;
    this.turmaService.findAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.turmas = data; this.loading = false; },
        error: () => { this.loading = false; }
      });
  }

  abrirNovo(): void {
    this.turmaSelecionadaId = null;
    this.modalAtivo = 'form';
  }

  abrirEdicao(id: number): void {
    this.turmaSelecionadaId = id;
    this.modalAtivo = 'form';
  }

  abrirDetalhe(id: number): void {
    this.turmaSelecionadaId = id;
    this.modalAtivo = 'detail';
  }

  fecharModal(): void {
    this.modalAtivo = null;
    this.turmaSelecionadaId = null;
  }

  excluir(id: number, nome: string): void {
    if (!confirm(`Excluir a turma "${nome}"?`)) return;
    this.turmaService.delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
