import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { AlunoResponse } from '../../../../core/models/responses/aluno.response';
import { AlunoService } from '../../services/aluno.service';
import { AlunoFormComponent } from '../aluno-form/aluno-form.component';
import { AlunoDetailComponent } from '../aluno-detail/aluno-detail.component';
import { BoletimModalComponent } from '../boletim-modal/boletim-modal.component';
import { FrequenciaModalComponent } from '../frequencia-modal/frequencia-modal.component';

type ModalAtivo = 'form' | 'detail' | 'boletim' | 'frequencia' | null;

@Component({
  selector: 'app-aluno-list',
  standalone: true,
  imports: [
    CommonModule,
    AlunoFormComponent,
    AlunoDetailComponent,
    BoletimModalComponent,
    FrequenciaModalComponent
  ],
  templateUrl: './aluno-list.component.html',
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
    .empty { text-align: center; padding: 32px; color: #6b7280; }
    .loading { text-align: center; padding: 32px; }
  `]
})
export class AlunoListComponent implements OnInit, OnDestroy {

  alunos: AlunoResponse[] = [];
  loading = false;
  modalAtivo: ModalAtivo = null;
  alunoSelecionadoId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(private alunoService: AlunoService) {}

  ngOnInit(): void {
    this.carregarAlunos();

    this.alunoService.alunoAtualizado$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.carregarAlunos());
  }

  carregarAlunos(): void {
    this.loading = true;
    this.alunoService.findAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.alunos = data;
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
  }

  abrirNovo(): void {
    this.alunoSelecionadoId = null;
    this.modalAtivo = 'form';
  }

  abrirEdicao(id: number): void {
    this.alunoSelecionadoId = id;
    this.modalAtivo = 'form';
  }

  abrirDetalhe(id: number): void {
    this.alunoSelecionadoId = id;
    this.modalAtivo = 'detail';
  }

  abrirBoletim(id: number): void {
    this.alunoSelecionadoId = id;
    this.modalAtivo = 'boletim';
  }

  abrirFrequencia(id: number): void {
    this.alunoSelecionadoId = id;
    this.modalAtivo = 'frequencia';
  }

  fecharModal(): void {
    this.modalAtivo = null;
    this.alunoSelecionadoId = null;
  }

  excluir(id: number, nome: string): void {
    if (!confirm(`Excluir o aluno "${nome}"?`)) return;
    this.alunoService.delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
