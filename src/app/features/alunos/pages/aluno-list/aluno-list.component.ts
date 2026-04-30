import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { AlunoResponse } from '../../../../core/models/responses/aluno.response';
import { AlunoService } from '../../data-access/aluno.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Role } from '../../../../core/models/enums/role.enum';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AlunoFormComponent } from '../../components/aluno-form/aluno-form.component';
import { AlunoDetailComponent, AlunoDetailData } from '../../components/aluno-detail/aluno-detail.component';
import { BoletimModalComponent, BoletimDialogData } from '../../components/boletim-modal/boletim-modal.component';
import { FrequenciaModalComponent, FrequenciaDialogData } from '../../components/frequencia-modal/frequencia-modal.component';

type ModalAtivo = 'form' | null;

@Component({
  selector: 'app-aluno-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
export class AlunoListComponent {
  protected alunos = signal<AlunoResponse[]>([]);
  protected loading = signal(false);
  protected modalAtivo = signal<ModalAtivo>(null);
  protected alunoSelecionadoId = signal<number | null>(null);

  readonly displayedColumns = ['id', 'nome', 'cpf', 'email', 'acoes'];

  private alunoService = inject(AlunoService);
  private auth = inject(AuthService);
  private confirmDialog = inject(ConfirmDialogService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  protected isSecretaria = computed(() => this.auth.hasRole(Role.SECRETARIA));

  constructor() {
    this.carregarAlunos();
    this.alunoService.alunoAtualizado$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.carregarAlunos());
  }

  carregarAlunos(): void {
    this.loading.set(true);
    this.alunoService.findAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.alunos.set(data); this.loading.set(false); },
        error: () => { this.loading.set(false); }
      });
  }

  abrirNovo(): void { this.alunoSelecionadoId.set(null); this.modalAtivo.set('form'); }
  abrirEdicao(id: number): void { this.alunoSelecionadoId.set(id); this.modalAtivo.set('form'); }

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
    this.modalAtivo.set(null);
    this.alunoSelecionadoId.set(null);
  }

  excluir(id: number, nome: string): void {
    this.confirmDialog
      .confirmDelete(`Excluir o aluno "${nome}"? Esta ação não pode ser desfeita.`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(ok => {
        if (!ok) return;
        this.alunoService.delete(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.notification.success('Aluno excluído.'));
      });
  }
}
