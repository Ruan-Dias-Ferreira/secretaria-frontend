import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';

import { MatriculaRequest } from '../../../core/models/requests/matricula.request';
import { MatriculaStatusRequest } from '../../../core/models/requests/matricula-status.request';
import { MatriculaResponse } from '../../../core/models/responses/matricula.response';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MatriculaService {
  private readonly apiUrl = `${environment.apiUrl}/matricula`;

  private matriculaAtualizada = new Subject<void>();
  matriculaAtualizada$ = this.matriculaAtualizada.asObservable();

  constructor(private http: HttpClient) {}

  findAll(): Observable<MatriculaResponse[]> {
    return this.http.get<MatriculaResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<MatriculaResponse> {
    return this.http.get<MatriculaResponse>(`${this.apiUrl}/${id}`);
  }

  save(request: MatriculaRequest): Observable<MatriculaResponse> {
    return this.http
      .post<MatriculaResponse>(this.apiUrl, request)
      .pipe(tap(() => this.matriculaAtualizada.next()));
  }

  update(id: number, request: MatriculaRequest): Observable<MatriculaResponse> {
    return this.http
      .put<MatriculaResponse>(`${this.apiUrl}/${id}`, request)
      .pipe(tap(() => this.matriculaAtualizada.next()));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.matriculaAtualizada.next()));
  }

  updateStatus(id: number, request: MatriculaStatusRequest): Observable<MatriculaResponse> {
    return this.http
      .patch<MatriculaResponse>(`${this.apiUrl}/${id}/status`, request)
      .pipe(tap(() => this.matriculaAtualizada.next()));
  }
}
