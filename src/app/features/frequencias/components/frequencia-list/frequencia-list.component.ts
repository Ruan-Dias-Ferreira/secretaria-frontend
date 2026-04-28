import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { FrequenciaResponse } from '../../../../core/models/responses/frequencia.response';
import { FrequenciaService } from '../../services/frequencia.service';
import { FrequenciaFormComponent } from '../frequencia-form/frequencia-form.component';

@Component({
  selector: 'app-frequencia-list',
  standalone: true,
  imports: [CommonModule, FrequenciaFormComponent],
  templateUrl: './frequencia-list.component.html',
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
    .presente { color: #065f46; font-weight: 600; }
    .ausente { color: #991b1b; font-weight: 600; }
  `]
})
export class FrequenciaListComponent implements OnInit, OnDestroy {

  frequencias: FrequenciaResponse[] = [];
  loading = false;
  modalFormAberto = false;
  frequenciaSelecionadaId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(private frequenciaService: FrequenciaService) {}

  ngOnInit(): void {
    this.carregarFrequencias();
    this.frequenciaService.frequenciaAtualizada$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.carregarFrequencias());
  }

  carregarFrequencias(): void {
    this.loading = true;
    this.frequenciaService.findAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.frequencias = data; this.loading = false; },
        error: () => { this.loading = false; }
      });
  }

  abrirNovo(): void {
    this.frequenciaSelecionadaId = null;
    this.modalFormAberto = true;
  }

  abrirEdicao(id: number): void {
    this.frequenciaSelecionadaId = id;
    this.modalFormAberto = true;
  }

  fecharModal(): void {
    this.modalFormAberto = false;
    this.frequenciaSelecionadaId = null;
  }

  excluir(id: number): void {
    if (!confirm('Excluir este registro de frequência?')) return;
    this.frequenciaService.delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
