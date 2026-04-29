import { Injectable, signal } from '@angular/core';

export interface HistoryItem {
  label: string;
  url: string;
  time: string;
}

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly _items = signal<HistoryItem[]>([]);
  readonly items = this._items.asReadonly();

  add(label: string, url: string): void {
    if (!label || url === '/dashboard' || url === '/') return;
    const time = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    this._items.update(prev => {
      const deduped = prev.filter(i => i.url !== url);
      return [{ label, url, time }, ...deduped].slice(0, 30);
    });
  }
}
