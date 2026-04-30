import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NgClass } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FrequenciaResponse } from '../../../../core/models/responses/frequencia.response';
import { FrequenciaService } from '../../data-access/frequencia.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Role } from '../../../../core/models/enums/role.enum';
import { FrequenciaFormComponent } from '../../components/frequencia-form/frequencia-form.component';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-frequencia-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    FrequenciaFormComponent,
  ],
  templateUrl: './frequencia-list.component.html',
  styles: [`
    table { width: 100%; }
    .actions-cell { display: flex; gap: 4px; justify-content: flex-end; }
    h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .badge {
      display: inline-block; padding: 4px 10px; border-radius: 12px;
      font-size: 12px; font-weight: 600;
    }
    .badge-presente { background: #d1fae5; color: #065f46; }
    .badge-ausente  { background: #fee2e2; color: #991b1b; }
  `]
})
export class FrequenciaListComponent implements OnInit {

  protected frequencias = signal<FrequenciaResponse[]>([]);
  protected loading = signal(false);
  protected modalFormAberto = signal(false);
  protected frequenciaSelecionadaId = signal<number | null>(null);

  readonly displayedColumns = ['id', 'alunoId', 'disciplinaId', 'data', 'presente', 'acoes'];

  private frequenciaService = inject(FrequenciaService);
  private auth = inject(AuthService);
  private confirmDialog = inject(ConfirmDialogService);
  private notification = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  protected isSecretaria = computed(() => this.auth.hasRole(Role.SECRETARIA));

  constructor() {
    this.frequenciaService.frequenciaAtualizada$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.carregar());
  }

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.frequenciaService.findAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: d => { this.frequencias.set(d); this.loading.set(false); },
        error: () => { this.loading.set(false); }
      });
  }

  abrirNovo(): void { this.frequenciaSelecionadaId.set(null); this.modalFormAberto.set(true); }
  abrirEdicao(id: number): void { this.frequenciaSelecionadaId.set(id); this.modalFormAberto.set(true); }
  fecharModal(): void { this.modalFormAberto.set(false); this.frequenciaSelecionadaId.set(null); }

  excluir(id: number): void {
    this.confirmDialog.confirmDelete('Excluir este registro de frequência? Esta ação não pode ser desfeita.')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(ok => {
        if (!ok) return;
        this.frequenciaService.delete(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.notification.success('Frequência excluída.'));
      });
  }
}
