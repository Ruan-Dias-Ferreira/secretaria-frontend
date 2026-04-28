import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { MatriculaResponse } from '../../../../core/models/responses/matricula.response';
import { MatriculaService } from '../../services/matricula.service';
import { MatriculaFormComponent } from '../matricula-form/matricula-form.component';
import { MatriculaDetailComponent } from '../matricula-detail/matricula-detail.component';
import { StatusMatricula } from '../../../../core/models/enums/status-matricula.enum';
import { MatriculaStatusRequest } from '../../../../core/models/requests/matricula-status.request';

type ModalAtivo = 'form' | 'detail' | null;

@Component({
  selector: 'app-matricula-list',
  standalone: true,
  imports: [CommonModule, MatriculaFormComponent, MatriculaDetailComponent],
  templateUrl: './matricula-list.component.html',
  styles: [`
    .container { padding: 24px; max-width: 1100px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    h1 { margin: 0; }
    button { padding: 8px 14px; border: none; border-radius: 6px; cursor: pointer; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-secondary { background: #e5e7eb; color: #111827; }
    .btn-danger { background: #dc2626; color: #fff; }
    .btn-warning { background: #f59e0b; color: #111827; }
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; }
    .actions { display: flex; gap: 6px; }
    .actions button { padding: 6px 10px; font-size: 12px; }
    .empty, .loading { text-align: center; padding: 32px; color: #6b7280; }
    .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
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

  statusOptions = Object.values(StatusMatricula);

  private destroy$ = new Subject<void>();

  constructor(private matriculaService: MatriculaService) {}

  ngOnInit(): void {
    this.carregarMatriculas();
    this.matriculaService.matriculaAtualizada$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.carregarMatriculas());
  }

  carregarMatriculas(): void {
    this.loading = true;
    this.matriculaService.findAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.matriculas = data; this.loading = false; },
        error: () => { this.loading = false; }
      });
  }

  abrirNovo(): void {
    this.matriculaSelecionadaId = null;
    this.modalAtivo = 'form';
  }

  abrirEdicao(id: number): void {
    this.matriculaSelecionadaId = id;
    this.modalAtivo = 'form';
  }

  abrirDetalhe(id: number): void {
    this.matriculaSelecionadaId = id;
    this.modalAtivo = 'detail';
  }

  fecharModal(): void {
    this.modalAtivo = null;
    this.matriculaSelecionadaId = null;
  }

  alterarStatus(id: number, novoStatus: StatusMatricula): void {
    const request: MatriculaStatusRequest = { status: novoStatus };
    this.matriculaService.updateStatus(id, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  excluir(id: number): void {
    if (!confirm('Excluir esta matrícula?')) return;
    this.matriculaService.delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
