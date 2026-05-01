import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';

import { EventoRequest } from '../../../core/models/requests/evento.request';
import { EventoResponse } from '../../../core/models/responses/evento.response';
import { environment } from '../../../../environments/environment';

export interface EventoSaveResult {
  evento: EventoResponse;
  frequenciasRemovidas: number;
}

@Injectable({ providedIn: 'root' })
export class EventoService {
  private readonly apiUrl = `${environment.apiUrl}/eventos`;
  private http = inject(HttpClient);

  private eventoAtualizado = new Subject<void>();
  eventoAtualizado$ = this.eventoAtualizado.asObservable();

  findAll(): Observable<EventoResponse[]> {
    return this.http.get<EventoResponse[]>(this.apiUrl);
  }

  findByPeriodo(inicio: string, fim: string): Observable<EventoResponse[]> {
    const params = new HttpParams().set('inicio', inicio).set('fim', fim);
    return this.http.get<EventoResponse[]>(this.apiUrl, { params });
  }

  save(request: EventoRequest): Observable<EventoSaveResult> {
    return this.http
      .post<EventoSaveResult>(this.apiUrl, request)
      .pipe(tap(() => this.eventoAtualizado.next()));
  }

  update(id: number, request: EventoRequest): Observable<EventoSaveResult> {
    return this.http
      .put<EventoSaveResult>(`${this.apiUrl}/${id}`, request)
      .pipe(tap(() => this.eventoAtualizado.next()));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.eventoAtualizado.next()));
  }
}
