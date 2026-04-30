import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NgClass } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { NotaResponse } from '../../../../core/models/responses/nota.response';
import { NotaService } from '../../data-access/nota.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Role } from '../../../../core/models/enums/role.enum';
import { NotaFormComponent } from '../../components/nota-form/nota-form.component';

@Component({
  selector: 'app-nota-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    NotaFormComponent,
  ],
  templateUrl: './nota-list.component.html',
  styles: [`
    table { width: 100%; }
    .actions-cell { display: flex; gap: 4px; justify-content: flex-end; }
    h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .badge {
      display: inline-block; padding: 4px 10px; border-radius: 12px;
      font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .3px;
    }
    .badge-aprovado    { background: #d1fae5; color: #065f46; }
    .badge-recuperacao { background: #fef3c7; color: #92400e; }
    .badge-reprovado   { background: #fee2e2; color: #991b1b; }
    .badge-desistente  { background: #f3f4f6; color: #6b7280; }
    .badge-transferido { background: #dbeafe; color: #1e40af; }
  `]
})
export class NotaListComponent implements OnInit {

  protected notas = signal<NotaResponse[]>([]);
  protected loading = signal(false);
  protected modalFormAberto = signal(false);
  protected notaSelecionadaId = signal<number | null>(null);

  readonly displayedColumns = ['id', 'alunoId', 'disciplinaId', 'bimestre', 'valor', 'situacao', 'acoes'];

  private notaService = inject(NotaService);
  private auth = inject(AuthService);
  private confirmDialog = inject(ConfirmDialogService);
  private notification = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  protected isSecretaria = computed(() => this.auth.hasRole(Role.SECRETARIA));

  constructor() {
    this.notaService.notaAtualizada$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.carregar());
  }

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.notaService.findAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: d => { this.notas.set(d); this.loading.set(false); },
        error: () => { this.loading.set(false); }
      });
  }

  abrirNovo(): void { this.notaSelecionadaId.set(null); this.modalFormAberto.set(true); }
  abrirEdicao(id: number): void { this.notaSelecionadaId.set(id); this.modalFormAberto.set(true); }
  fecharModal(): void { this.modalFormAberto.set(false); this.notaSelecionadaId.set(null); }

  excluir(id: number): void {
    this.confirmDialog.confirmDelete('Excluir esta nota? Esta ação não pode ser desfeita.')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(ok => {
        if (!ok) return;
        this.notaService.delete(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.notification.success('Nota excluída.'));
      });
  }

  getSituacaoClass(situacao: string): string {
    const map: Record<string, string> = {
      'APROVADO':    'badge-aprovado',
      'RECUPERACAO': 'badge-recuperacao',
      'REPROVADO':   'badge-reprovado',
      'DESISTENTE':  'badge-desistente',
      'TRANSFERIDO': 'badge-transferido'
    };
    return map[situacao] || '';
  }
}
