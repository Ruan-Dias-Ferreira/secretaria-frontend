import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';

import { NotaRequest } from '../../../core/models/requests/nota.request';
import { NotaResponse } from '../../../core/models/responses/nota.response';
import { BoletimResponse } from '../../../core/models/responses/boletim.response';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotaService {
  private readonly apiUrl = `${environment.apiUrl}/nota`;

  private http = inject(HttpClient);

  private notaAtualizada = new Subject<void>();
  notaAtualizada$ = this.notaAtualizada.asObservable();

  findAll(): Observable<NotaResponse[]> {
    return this.http.get<NotaResponse[]>(this.apiUrl);
  }

  getBoletim(alunoId: number): Observable<BoletimResponse[]> {
    return this.http.get<BoletimResponse[]>(`${this.apiUrl}/boletim/${alunoId}`);
  }

  findById(id: number): Observable<NotaResponse> {
    return this.http.get<NotaResponse>(`${this.apiUrl}/${id}`);
  }

  save(request: NotaRequest): Observable<NotaResponse> {
    return this.http
      .post<NotaResponse>(this.apiUrl, request)
      .pipe(tap(() => this.notaAtualizada.next()));
  }

  update(id: number, request: NotaRequest): Observable<NotaResponse> {
    return this.http
      .put<NotaResponse>(`${this.apiUrl}/${id}`, request)
      .pipe(tap(() => this.notaAtualizada.next()));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.notaAtualizada.next()));
  }
}
