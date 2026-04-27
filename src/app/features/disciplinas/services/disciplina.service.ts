import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';

import { DisciplinaRequest } from '../../../core/models/requests/disciplina.request';
import { DisciplinaResponse } from '../../../core/models/responses/disciplina.response';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DisciplinaService {
  private readonly apiUrl = `${environment.apiUrl}/disciplina`;

  private disciplinaAtualizada = new Subject<void>();
  disciplinaAtualizada$ = this.disciplinaAtualizada.asObservable();

  constructor(private http: HttpClient) {}

  findAll(): Observable<DisciplinaResponse[]> {
    return this.http.get<DisciplinaResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<DisciplinaResponse> {
    return this.http.get<DisciplinaResponse>(`${this.apiUrl}/${id}`);
  }

  save(request: DisciplinaRequest): Observable<DisciplinaResponse> {
    return this.http
      .post<DisciplinaResponse>(this.apiUrl, request)
      .pipe(tap(() => this.disciplinaAtualizada.next()));
  }

  update(id: number, request: DisciplinaRequest): Observable<DisciplinaResponse> {
    return this.http
      .put<DisciplinaResponse>(`${this.apiUrl}/${id}`, request)
      .pipe(tap(() => this.disciplinaAtualizada.next()));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.disciplinaAtualizada.next()));
  }
}
