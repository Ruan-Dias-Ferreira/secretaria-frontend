import {
  ChangeDetectionStrategy, Component, inject, signal, computed
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';

interface CalendarEvent {
  date: string; // YYYY-MM-DD
  title: string;
  descricao?: string;
}

const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

@Component({
  selector: 'app-event-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule, MatIconModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, ReactiveFormsModule,
  ],
  templateUrl: './event-calendar.component.html',
  styleUrl: './event-calendar.component.scss',
})
export class EventCalendarComponent {
  private readonly dialog = inject(MatDialog);
  private readonly fb     = inject(NonNullableFormBuilder);

  protected readonly today    = new Date();
  protected readonly viewDate = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
  protected readonly events   = signal<CalendarEvent[]>([]);

  protected readonly days     = DAYS;
  protected readonly monthLabel = computed(() => {
    const d = this.viewDate();
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  });

  protected readonly cells = computed(() => {
    const d     = this.viewDate();
    const year  = d.getFullYear();
    const month = d.getMonth();
    const first = new Date(year, month, 1).getDay();
    const last  = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = Array(first).fill(null);
    for (let i = 1; i <= last; i++) cells.push(i);
    return cells;
  });

  protected prevMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  protected isToday(day: number | null): boolean {
    if (!day) return false;
    const d = this.viewDate();
    return d.getFullYear() === this.today.getFullYear()
        && d.getMonth() === this.today.getMonth()
        && day === this.today.getDate();
  }

  protected hasEvent(day: number | null): boolean {
    if (!day) return false;
    const key = this.dateKey(day);
    return this.events().some(e => e.date === key);
  }

  protected dateKey(day: number): string {
    const d = this.viewDate();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${dd}`;
  }

  protected openEventDialog(day: number | null): void {
    if (!day) return;
    const key   = this.dateKey(day);
    const exist = this.events().find(e => e.date === key);
    const titulo  = this.fb.control(exist?.title ?? '');
    const descricao = this.fb.control(exist?.descricao ?? '');

    const ref = this.dialog.open(EventDialogComponent, {
      data: { date: key, titulo, descricao },
      width: '360px',
    });

    ref.afterClosed().subscribe((saved: boolean) => {
      if (!saved) return;
      this.events.update(evts => {
        const filtered = evts.filter(e => e.date !== key);
        if (titulo.value) {
          filtered.push({ date: key, title: titulo.value, descricao: descricao.value });
        }
        return filtered;
      });
    });
  }
}

/* ─── Inline dialog component ──────────────────────────────────── */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

interface DialogData { date: string; titulo: FormControl<string>; descricao: FormControl<string>; }

@Component({
  selector: 'app-event-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Evento — {{ data.date }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Título</mat-label>
        <input matInput [formControl]="data.titulo" />
      </mat-form-field>
      <mat-form-field appearance="outline" style="width:100%;margin-top:8px">
        <mat-label>Descrição</mat-label>
        <textarea matInput [formControl]="data.descricao" rows="3"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancelar</button>
      <button mat-flat-button color="primary" [mat-dialog-close]="true">Salvar</button>
    </mat-dialog-actions>
  `,
})
export class EventDialogComponent {
  protected readonly data = inject<DialogData>(MAT_DIALOG_DATA);
}
