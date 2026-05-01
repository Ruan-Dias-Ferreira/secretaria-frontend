import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { AlunoResponse } from '../../../../core/models/responses/aluno.response';
import { AlunoService } from '../../data-access/aluno.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Role } from '../../../../core/models/enums/role.enum';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AlunoDetailComponent, AlunoDetailData } from '../../components/aluno-detail/aluno-detail.component';
import { BoletimModalComponent, BoletimDialogData } from '../../components/boletim-modal/boletim-modal.component';
import { FrequenciaModalComponent, FrequenciaDialogData } from '../../components/frequencia-modal/frequencia-modal.component';

@Component({
  selector: 'app-aluno-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './aluno-list.component.html',
  styles: [`
    table { width: 100%; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: rgba(0,0,0,0.04); }
    h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .search-bar { display: flex; gap: 12px; align-items: flex-start; margin-top: 16px; }
    .search-bar mat-form-field { flex: 1; }
    .actions-row { display: flex; gap: 12px; margin-bottom: 16px; }
  `]
})
export class AlunoListComponent {
  protected alunos = signal<AlunoResponse[]>([]);
  protected loading = signal(false);
  protected buscaRealizada = signal(false);
  protected termoBusca = signal('');

  readonly displayedColumns = ['id', 'nome', 'cpf', 'responsavel'];

  private alunoService = inject(AlunoService);
  private auth = inject(AuthService);
  private confirmDialog = inject(ConfirmDialogService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  protected isSecretaria = computed(() => this.auth.hasRole(Role.SECRETARIA));

  constructor() {
    this.alunoService.alunoAtualizado$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.buscaRealizada()) this.buscar();
      });
  }

  buscar(): void {
    const q = this.termoBusca().trim();
    this.loading.set(true);
    this.buscaRealizada.set(true);
    const req$ = q ? this.alunoService.search(q) : this.alunoService.findAll();
    req$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.alunos.set(data); this.loading.set(false); },
        error: () => { this.loading.set(false); }
      });
  }

  limparBusca(): void {
    this.termoBusca.set('');
    this.alunos.set([]);
    this.buscaRealizada.set(false);
  }

  abrirNovo(): void { this.router.navigate(['/alunos/novo']); }
  abrirEdicao(id: number): void { this.router.navigate(['/alunos', id, 'editar']); }
  abrirPerfil(id: number): void { this.router.navigate(['/alunos', id, 'perfil']); }

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
