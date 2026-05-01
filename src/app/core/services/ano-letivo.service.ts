import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

const STORAGE_KEY = 'secretaria.anoLetivo';

interface Stored { ano: number; semestre: 1 | 2; }

@Injectable({ providedIn: 'root' })
export class AnoLetivoService {
  private readonly http = inject(HttpClient);
  private readonly stored = this.loadStored();

  readonly ano = signal<number>(this.stored?.ano ?? new Date().getFullYear());
  readonly semestre = signal<1 | 2>(this.stored?.semestre ?? (new Date().getMonth() < 6 ? 1 : 2));

  readonly label = computed(() => `${this.ano()} · ${this.semestre()}º sem`);

  readonly status = computed<'PASSADO' | 'ATUAL' | 'FUTURO'>(() => {
    const now = new Date();
    const anoNow = now.getFullYear();
    const semNow: 1 | 2 = now.getMonth() < 6 ? 1 : 2;
    const cmp = this.ano() !== anoNow ? this.ano() - anoNow : this.semestre() - semNow;
    return cmp < 0 ? 'PASSADO' : cmp > 0 ? 'FUTURO' : 'ATUAL';
  });

  readonly emAndamento = computed(() => this.status() === 'ATUAL');

  constructor() {
    effect(() => {
      const data: Stored = { ano: this.ano(), semestre: this.semestre() };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
    });
  }

  setAno(ano: number): void { this.ano.set(ano); }
  setSemestre(s: 1 | 2): void { this.semestre.set(s); }

  exists(ano: number): Observable<boolean> {
    return this.http
      .get<{ exists: boolean }>(`${environment.apiUrl}/ano-letivo/exists`, { params: { ano } })
      .pipe(map(r => r.exists));
  }

  private loadStored(): Stored | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as Stored : null;
    } catch { return null; }
  }
}
