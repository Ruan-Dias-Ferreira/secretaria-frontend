import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';

import { FrequenciaRequest } from '../../../core/models/requests/frequencia.request';
import { FrequenciaResponse } from '../../../core/models/responses/frequencia.response';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FrequenciaService {
  private readonly apiUrl = `${environment.apiUrl}/frequencia`;

  private frequenciaAtualizada = new Subject<void>();
  frequenciaAtualizada$ = this.frequenciaAtualizada.asObservable();

  constructor(private http: HttpClient) {}

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
