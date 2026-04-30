import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';

import { TurmaRequest } from '../../../core/models/requests/turma.request';
import { TurmaResponse } from '../../../core/models/responses/turma.response';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TurmaService {
  private readonly apiUrl = `${environment.apiUrl}/turma`;

  private http = inject(HttpClient);

  private turmaAtualizada = new Subject<void>();
  turmaAtualizada$ = this.turmaAtualizada.asObservable();

  findAll(): Observable<TurmaResponse[]> {
    return this.http.get<TurmaResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<TurmaResponse> {
    return this.http.get<TurmaResponse>(`${this.apiUrl}/${id}`);
  }

  save(request: TurmaRequest): Observable<TurmaResponse> {
    return this.http
      .post<TurmaResponse>(this.apiUrl, request)
      .pipe(tap(() => this.turmaAtualizada.next()));
  }

  update(id: number, request: TurmaRequest): Observable<TurmaResponse> {
    return this.http
      .put<TurmaResponse>(`${this.apiUrl}/${id}`, request)
      .pipe(tap(() => this.turmaAtualizada.next()));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.turmaAtualizada.next()));
  }
}
