import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { UsuarioResponse } from '../../../../core/models/responses/usuario.response';
import { UsuarioService } from '../../data-access/usuario.service';
import { UsuarioFormComponent } from '../../components/usuario-form/usuario-form.component';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    UsuarioFormComponent
  ],
  templateUrl: './usuario-list.component.html',
  styles: [`
    table { width: 100%; }
    .actions-cell { display: flex; gap: 4px; justify-content: flex-end; }
    h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .badge {
      display: inline-block; padding: 4px 10px; border-radius: 12px;
      font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .3px;
    }
    .badge-secretaria { background: #ede9fe; color: #5b21b6; }
    .badge-professor   { background: #dbeafe; color: #1e40af; }
    .badge-aluno       { background: #d1fae5; color: #065f46; }
  `]
})
export class UsuarioListComponent implements OnInit {

  protected usuarios = signal<UsuarioResponse[]>([]);
  protected loading = signal(false);
  protected modalFormAberto = signal(false);
  protected selectedId = signal<number | null>(null);

  readonly displayedColumns = ['id', 'login', 'role', 'acoes'];

  private usuarioService = inject(UsuarioService);
  private confirmDialog = inject(ConfirmDialogService);
  private notification = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.carregar();
    this.usuarioService.usuarioAtualizado$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.carregar());
  }

  carregar(): void {
    this.loading.set(true);
    this.usuarioService.findAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: d => { this.usuarios.set(d); this.loading.set(false); },
        error: () => { this.loading.set(false); }
      });
  }

  abrirNovo(): void { this.selectedId.set(null); this.modalFormAberto.set(true); }
  abrirEdicao(id: number): void { this.selectedId.set(id); this.modalFormAberto.set(true); }
  fecharModal(): void { this.modalFormAberto.set(false); this.selectedId.set(null); }

  excluir(id: number, login: string): void {
    this.confirmDialog.confirmDelete(`Excluir o usuário "${login}"? Esta ação não pode ser desfeita.`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(ok => {
        if (!ok) return;
        this.usuarioService.delete(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.notification.success(`Usuário "${login}" excluído.`));
      });
  }

  getRoleClass(role: string): string {
    const map: Record<string, string> = {
      SECRETARIA: 'badge-secretaria',
      PROFESSOR:  'badge-professor',
      ALUNO:      'badge-aluno'
    };
    return map[role] || '';
  }
}
