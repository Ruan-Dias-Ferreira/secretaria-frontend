import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { DisciplinaResponse } from '../../../../core/models/responses/disciplina.response';
import { DisciplinaService } from '../../services/disciplina.service';
import { DisciplinaFormComponent } from '../disciplina-form/disciplina-form.component';
import { DisciplinaDetailComponent } from '../disciplina-detail/disciplina-detail.component';

type ModalAtivo = 'form' | 'detail' | null;

@Component({
  selector: 'app-disciplina-list',
  standalone: true,
  imports: [CommonModule, DisciplinaFormComponent, DisciplinaDetailComponent],
  templateUrl: './disciplina-list.component.html',
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
    .muted { color: #9ca3af; font-style: italic; }
  `]
})
export class DisciplinaListComponent implements OnInit, OnDestroy {

  disciplinas: DisciplinaResponse[] = [];
  loading = false;
  modalAtivo: ModalAtivo = null;
  disciplinaSelecionadaId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(private disciplinaService: DisciplinaService) {}

  ngOnInit(): void {
    this.carregarDisciplinas();
    this.disciplinaService.disciplinaAtualizada$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.carregarDisciplinas());
  }

  carregarDisciplinas(): void {
    this.loading = true;
    this.disciplinaService.findAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.disciplinas = data; this.loading = false; },
        error: () => { this.loading = false; }
      });
  }

  abrirNovo(): void {
    this.disciplinaSelecionadaId = null;
    this.modalAtivo = 'form';
  }

  abrirEdicao(id: number): void {
    this.disciplinaSelecionadaId = id;
    this.modalAtivo = 'form';
  }

  abrirDetalhe(id: number): void {
    this.disciplinaSelecionadaId = id;
    this.modalAtivo = 'detail';
  }

  fecharModal(): void {
    this.modalAtivo = null;
    this.disciplinaSelecionadaId = null;
  }

  excluir(id: number, nome: string): void {
    if (!confirm(`Excluir a disciplina "${nome}"?`)) return;
    this.disciplinaService.delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
