import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { TurmaResponse } from '../../../../core/models/responses/turma.response';
import { TurmaService } from '../../data-access/turma.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Role } from '../../../../core/models/enums/role.enum';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TurmaFormComponent } from '../../components/turma-form/turma-form.component';
import { TurmaDetailComponent, TurmaDetailData } from '../../components/turma-detail/turma-detail.component';

type ModalAtivo = 'form' | null;

@Component({
  selector: 'app-turma-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    TurmaFormComponent
  ],
  templateUrl: './turma-list.component.html',
  styles: [`
    table { width: 100%; }
    .actions-cell { display: flex; gap: 4px; justify-content: flex-end; }
    h1 { margin: 0; font-size: 24px; font-weight: 500; }
  `]
})
export class TurmaListComponent {

  protected turmas = signal<TurmaResponse[]>([]);
  protected loading = signal(false);
  protected modalAtivo = signal<ModalAtivo>(null);
  protected turmaSelecionadaId = signal<number | null>(null);

  readonly displayedColumns = ['id', 'nome', 'anoLetivo', 'turno', 'curso', 'acoes'];

  private turmaService = inject(TurmaService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private confirmDialog = inject(ConfirmDialogService);
  private notification = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  protected isSecretaria = computed(() => this.auth.hasRole(Role.SECRETARIA));

  constructor() {
    this.carregar();
    this.turmaService.turmaAtualizada$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.carregar());
  }

  carregar(): void {
    this.loading.set(true);
    this.turmaService.findAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: d => { this.turmas.set(d); this.loading.set(false); },
        error: () => { this.loading.set(false); }
      });
  }

  abrirNovo(): void { this.turmaSelecionadaId.set(null); this.modalAtivo.set('form'); }
  abrirEdicao(id: number): void { this.turmaSelecionadaId.set(id); this.modalAtivo.set('form'); }

  abrirDetalhe(id: number): void {
    this.dialog.open(TurmaDetailComponent, {
      data: { turmaId: id } satisfies TurmaDetailData
    });
  }

  fecharModal(): void { this.modalAtivo.set(null); this.turmaSelecionadaId.set(null); }

  excluir(id: number, nome: string): void {
    this.confirmDialog.confirmDelete(`Excluir a turma "${nome}"? Esta ação não pode ser desfeita.`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(ok => {
        if (!ok) return;
        this.turmaService.delete(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.notification.success('Turma excluída.'));
      });
  }
}
