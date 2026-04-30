import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { DisciplinaResponse } from '../../../../core/models/responses/disciplina.response';
import { DisciplinaService } from '../../data-access/disciplina.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Role } from '../../../../core/models/enums/role.enum';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { DisciplinaFormComponent } from '../../components/disciplina-form/disciplina-form.component';
import { DisciplinaDetailComponent, DisciplinaDetailData } from '../../components/disciplina-detail/disciplina-detail.component';

type ModalAtivo = 'form' | null;

@Component({
  selector: 'app-disciplina-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    DisciplinaFormComponent
  ],
  templateUrl: './disciplina-list.component.html',
  styles: [`
    table { width: 100%; }
    .actions-cell { display: flex; gap: 4px; justify-content: flex-end; }
    h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .muted { color: var(--mat-sys-on-surface-variant); font-style: italic; }
  `]
})
export class DisciplinaListComponent {

  protected disciplinas = signal<DisciplinaResponse[]>([]);
  protected loading = signal(false);
  protected modalAtivo = signal<ModalAtivo>(null);
  protected disciplinaSelecionadaId = signal<number | null>(null);

  readonly displayedColumns = ['id', 'nome', 'cargaHoraria', 'turma', 'professor', 'acoes'];

  private disciplinaService = inject(DisciplinaService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private confirmDialog = inject(ConfirmDialogService);
  private notification = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  protected isSecretaria = computed(() => this.auth.hasRole(Role.SECRETARIA));

  constructor() {
    this.carregar();
    this.disciplinaService.disciplinaAtualizada$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.carregar());
  }

  carregar(): void {
    this.loading.set(true);
    this.disciplinaService.findAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: d => { this.disciplinas.set(d); this.loading.set(false); },
        error: () => { this.loading.set(false); }
      });
  }

  abrirNovo(): void { this.disciplinaSelecionadaId.set(null); this.modalAtivo.set('form'); }
  abrirEdicao(id: number): void { this.disciplinaSelecionadaId.set(id); this.modalAtivo.set('form'); }

  abrirDetalhe(id: number): void {
    this.dialog.open(DisciplinaDetailComponent, {
      data: { disciplinaId: id } satisfies DisciplinaDetailData
    });
  }

  fecharModal(): void { this.modalAtivo.set(null); this.disciplinaSelecionadaId.set(null); }

  excluir(id: number, nome: string): void {
    this.confirmDialog.confirmDelete(`Excluir a disciplina "${nome}"? Esta ação não pode ser desfeita.`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(ok => {
        if (!ok) return;
        this.disciplinaService.delete(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.notification.success('Disciplina excluída.'));
      });
  }
}
