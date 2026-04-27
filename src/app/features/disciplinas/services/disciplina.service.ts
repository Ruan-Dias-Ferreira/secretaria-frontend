import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { DisciplinaRequest } from '../../../core/models/requests/disciplina.request';
import { DisciplinaResponse } from '../../../core/models/responses/disciplina.response';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DisciplinaService {
  private readonly apiUrl = `${environment.apiUrl}/disciplina`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<DisciplinaResponse[]> {
    return this.http.get<DisciplinaResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<DisciplinaResponse> {
    return this.http.get<DisciplinaResponse>(`${this.apiUrl}/${id}`);
  }

  save(request: DisciplinaRequest): Observable<DisciplinaResponse> {
    return this.http.post<DisciplinaResponse>(this.apiUrl, request);
  }

  update(id: number, request: DisciplinaRequest): Observable<DisciplinaResponse> {
    return this.http.put<DisciplinaResponse>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
