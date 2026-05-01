import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';

import { MatriculaRequest } from '../../../core/models/requests/matricula.request';
import { MatriculaStatusRequest } from '../../../core/models/requests/matricula-status.request';
import { MatriculaResponse } from '../../../core/models/responses/matricula.response';
import { RematriculaJanelaResponse } from '../../../core/models/responses/rematricula-janela.response';
import { RematriculadoResponse } from '../../../core/models/responses/rematriculado.response';
import { environment } from '../../../../environments/environment';

export interface MatriculaStatsResponse {
  total: number;
  ativas: number;
  transferidas: number;
  canceladas: number;
}

export interface TransferenciaRequest {
  tipo: 'INTERNA' | 'EXTERNA';
  novaTurmaId?: number;
  novoTurno?: string;
  escolaDestino?: string;
  dataTransferencia: string;
  motivo: string;
  observacoes?: string;
}

export interface RematriculaRequest {
  alunoId: number;
  turmaDestinoId: number;
}

@Injectable({ providedIn: 'root' })
export class MatriculaService {
  private readonly apiUrl = `${environment.apiUrl}/matricula`;
  private http = inject(HttpClient);

  private matriculaAtualizada = new Subject<void>();
  matriculaAtualizada$ = this.matriculaAtualizada.asObservable();

  findAll(params?: Record<string, string>): Observable<MatriculaResponse[]> {
    let httpParams = new HttpParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v) httpParams = httpParams.set(k, v); });
    return this.http.get<MatriculaResponse[]>(this.apiUrl, { params: httpParams });
  }

  findById(id: number): Observable<MatriculaResponse> {
    return this.http.get<MatriculaResponse>(`${this.apiUrl}/${id}`);
  }

  search(q: string): Observable<MatriculaResponse[]> {
    return this.http.get<MatriculaResponse[]>(this.apiUrl, {
      params: new HttpParams().set('search', q),
    });
  }

  getStats(): Observable<MatriculaStatsResponse> {
    return this.http.get<MatriculaStatsResponse>(`${this.apiUrl}/stats`);
  }

  save(request: MatriculaRequest): Observable<MatriculaResponse> {
    return this.http.post<MatriculaResponse>(this.apiUrl, request)
      .pipe(tap(() => this.matriculaAtualizada.next()));
  }

  update(id: number, request: MatriculaRequest): Observable<MatriculaResponse> {
    return this.http.put<MatriculaResponse>(`${this.apiUrl}/${id}`, request)
      .pipe(tap(() => this.matriculaAtualizada.next()));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.matriculaAtualizada.next()));
  }

  cancelar(id: number, motivo: string, observacoes?: string): Observable<MatriculaResponse> {
    return this.http.patch<MatriculaResponse>(`${this.apiUrl}/${id}/cancelar`, { motivo, observacoes })
      .pipe(tap(() => this.matriculaAtualizada.next()));
  }

  transferir(id: number, request: TransferenciaRequest): Observable<MatriculaResponse> {
    return this.http.post<MatriculaResponse>(`${this.apiUrl}/${id}/transferir`, request)
      .pipe(tap(() => this.matriculaAtualizada.next()));
  }

  updateStatus(id: number, request: MatriculaStatusRequest): Observable<MatriculaResponse> {
    return this.http.patch<MatriculaResponse>(`${this.apiUrl}/${id}/status`, request)
      .pipe(tap(() => this.matriculaAtualizada.next()));
  }

  // ── Rematrícula ──────────────────────────────────────────────────────

  getJanelaRematricula(): Observable<RematriculaJanelaResponse> {
    return this.http.get<RematriculaJanelaResponse>(`${this.apiUrl}/rematricula/janela`);
  }

  findRematriculados(): Observable<RematriculadoResponse[]> {
    return this.http.get<RematriculadoResponse[]>(`${this.apiUrl}/rematriculados`);
  }

  rematricular(request: RematriculaRequest): Observable<MatriculaResponse> {
    return this.http.post<MatriculaResponse>(`${this.apiUrl}/rematricula`, request)
      .pipe(tap(() => this.matriculaAtualizada.next()));
  }

  editarRematricula(alunoId: number, request: RematriculaRequest): Observable<MatriculaResponse> {
    return this.http.put<MatriculaResponse>(`${this.apiUrl}/rematricula/${alunoId}`, request)
      .pipe(tap(() => this.matriculaAtualizada.next()));
  }

  cancelarRematricula(alunoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/rematricula/${alunoId}`)
      .pipe(tap(() => this.matriculaAtualizada.next()));
  }
}
