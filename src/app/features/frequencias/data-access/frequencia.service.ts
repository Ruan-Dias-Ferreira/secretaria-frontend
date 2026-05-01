import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';

import { FrequenciaRequest } from '../../../core/models/requests/frequencia.request';
import { FrequenciaResponse } from '../../../core/models/responses/frequencia.response';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FrequenciaService {
  private readonly apiUrl = `${environment.apiUrl}/frequencia`;

  private http = inject(HttpClient);

  private frequenciaAtualizada = new Subject<void>();
  frequenciaAtualizada$ = this.frequenciaAtualizada.asObservable();

  findAll(): Observable<FrequenciaResponse[]> {
    return this.http.get<FrequenciaResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<FrequenciaResponse> {
    return this.http.get<FrequenciaResponse>(`${this.apiUrl}/${id}`);
  }

  save(request: FrequenciaRequest): Observable<FrequenciaResponse> {
    return this.http
      .post<FrequenciaResponse>(this.apiUrl, request)
      .pipe(tap(() => this.frequenciaAtualizada.next()));
  }

  saveLote(requests: FrequenciaRequest[]): Observable<FrequenciaResponse[]> {
    return this.http
      .post<FrequenciaResponse[]>(`${this.apiUrl}/lote`, requests)
      .pipe(tap(() => this.frequenciaAtualizada.next()));
  }

  findByTurmaAndData(turmaId: number, data: string): Observable<FrequenciaResponse[]> {
    const params = new HttpParams().set('turmaId', String(turmaId)).set('data', data);
    return this.http.get<FrequenciaResponse[]>(`${this.apiUrl}/por-data-turma`, { params });
  }

  resumoDia(data?: string): Observable<{ data: string; alunosAtivos: number; presentes: number; percentual: number }> {
    let params = new HttpParams();
    if (data) params = params.set('data', data);
    return this.http.get<{ data: string; alunosAtivos: number; presentes: number; percentual: number }>(
      `${this.apiUrl}/resumo-dia`, { params }
    );
  }

  percentual(alunoId: number, inicio: string, fim: string): Observable<{ percentual: number }> {
    const params = new HttpParams()
      .set('alunoId', String(alunoId))
      .set('inicio', inicio)
      .set('fim', fim);
    return this.http.get<{ percentual: number }>(`${this.apiUrl}/percentual`, { params });
  }

  update(id: number, request: FrequenciaRequest): Observable<FrequenciaResponse> {
    return this.http
      .put<FrequenciaResponse>(`${this.apiUrl}/${id}`, request)
      .pipe(tap(() => this.frequenciaAtualizada.next()));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.frequenciaAtualizada.next()));
  }
}
