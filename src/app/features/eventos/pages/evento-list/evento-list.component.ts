import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { EventoService } from '../../data-access/evento.service';
import { EventoResponse } from '../../../../core/models/responses/evento.response';
import { TipoEvento } from '../../../../core/models/requests/evento.request';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-evento-list',
  standalone: true,
  imports: [FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './evento-list.component.html',
  styleUrls: ['./evento-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventoListComponent implements OnInit {
  private eventoService = inject(EventoService);
  private notify = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  protected eventos = signal<EventoResponse[]>([]);
  protected loading = signal(false);
  protected salvando = signal(false);

  protected formData = signal<string>('');
  protected formTipo = signal<TipoEvento>('FERIADO');
  protected formTitulo = signal<string>('');
  protected formDescricao = signal<string>('');

  protected tipos: { id: TipoEvento; label: string; icon: string }[] = [
    { id: 'FERIADO',           label: 'Feriado',           icon: 'flag' },
    { id: 'TRABALHO_COLETIVO', label: 'Trabalho Coletivo', icon: 'groups' },
  ];

  protected eventosOrdenados = computed(() =>
    [...this.eventos()].sort((a, b) => a.data.localeCompare(b.data))
  );

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.eventoService.findAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (list) => {
        this.eventos.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('Erro ao carregar eventos.');
        this.loading.set(false);
      },
    });
  }

  salvar(): void {
    const data = this.formData();
    const titulo = this.formTitulo().trim();
    if (!data || !titulo) {
      this.notify.info('Preencha data e título.');
      return;
    }
    this.salvando.set(true);
    this.eventoService.save({
      data,
      tipo: this.formTipo(),
      titulo,
      descricao: this.formDescricao().trim() || null,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const removidas = res?.frequenciasRemovidas ?? 0;
        const aviso = removidas > 0
          ? ` ${removidas} frequência(s) lançada(s) nesta data foram removidas.`
          : '';
        this.notify.success(`Evento cadastrado para ${data}.${aviso}`, removidas > 0 ? 6000 : 3000);
        this.formData.set('');
        this.formTitulo.set('');
        this.formDescricao.set('');
        this.salvando.set(false);
        this.carregar();
      },
      error: (err) => {
        const msg = err?.error?.message ?? err?.error?.error ?? 'Erro ao salvar evento.';
        this.notify.error(msg);
        this.salvando.set(false);
      },
    });
  }

  excluir(ev: EventoResponse): void {
    if (!confirm(`Excluir evento "${ev.titulo}" em ${ev.data}?`)) return;
    this.eventoService.delete(ev.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notify.success('Evento excluído.');
        this.carregar();
      },
      error: () => this.notify.error('Erro ao excluir evento.'),
    });
  }

  labelTipo(tipo: TipoEvento): string {
    return this.tipos.find(t => t.id === tipo)?.label ?? tipo;
  }

  iconTipo(tipo: TipoEvento): string {
    return this.tipos.find(t => t.id === tipo)?.icon ?? 'event';
  }
}
