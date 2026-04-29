import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, finalize, takeUntil } from 'rxjs';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { AlunoResponse } from '../../../../core/models/responses/aluno.response';
import { AlunoService } from '../../services/aluno.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Role } from '../../../../core/models/enums/role.enum';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AlunoFormComponent } from '../aluno-form/aluno-form.component';
import { AlunoDetailComponent, AlunoDetailData } from '../aluno-detail/aluno-detail.component';
import { BoletimModalComponent, BoletimDialogData } from '../boletim-modal/boletim-modal.component';
import { FrequenciaModalComponent, FrequenciaDialogData } from '../frequencia-modal/frequencia-modal.component';

type ModalAtivo = 'form' | null;

@Component({
  selector: 'app-aluno-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    AlunoFormComponent
  ],
  templateUrl: './aluno-list.component.html',
  styles: [`
    table { width: 100%; }
    .actions-cell { display: flex; gap: 4px; justify-content: flex-end; }
    h1 { margin: 0; font-size: 24px; font-weight: 500; }
  `]
})
export class AlunoListComponent implements OnInit, OnDestroy {
  alunos: AlunoResponse[] = [];
  loading = false;
  modalAtivo: ModalAtivo = null;
  alunoSelecionadoId: number | null = null;

  readonly displayedColumns = ['id', 'nome', 'cpf', 'email', 'acoes'];

  private destroy$ = new Subject<void>();

  constructor(
    private alunoService: AlunoService,
    private auth: AuthService,
    private confirmDialog: ConfirmDialogService,
    private notification: NotificationService,
    private dialog: MatDialog
  ) {}

  get isSecretaria(): boolean {
    return this.auth.hasRole(Role.SECRETARIA);
  }

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
        next: (data) => { this.alunos = data; this.loading = false; },
        error: () => { this.loading = false; }
      });
  }

  abrirNovo(): void { this.alunoSelecionadoId = null; this.modalAtivo = 'form'; }
  abrirEdicao(id: number): void { this.alunoSelecionadoId = id; this.modalAtivo = 'form'; }

  abrirDetalhe(id: number): void {
    this.dialog.open(AlunoDetailComponent, {
      data: { alunoId: id } satisfies AlunoDetailData
    });
  }

  abrirBoletim(id: number): void {
    this.dialog.open(BoletimModalComponent, {
      data: { alunoId: id } satisfies BoletimDialogData
    });
  }

  abrirFrequencia(id: number): void {
    this.dialog.open(FrequenciaModalComponent, {
      data: { alunoId: id } satisfies FrequenciaDialogData
    });
  }

  fecharModal(): void {
    this.modalAtivo = null;
    this.alunoSelecionadoId = null;
  }

  excluir(id: number, nome: string): void {
    this.confirmDialog
      .confirmDelete(`Excluir o aluno "${nome}"? Esta ação não pode ser desfeita.`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(ok => {
        if (!ok) return;
        this.alunoService.delete(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => this.notification.success('Aluno excluído.'));
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
