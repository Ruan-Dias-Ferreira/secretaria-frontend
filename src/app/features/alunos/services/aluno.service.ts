import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';

import { AlunoRequest } from '../../../core/models/requests/aluno.request';
import { AlunoResponse } from '../../../core/models/responses/aluno.response';
import { FrequenciaResumoResponse } from '../../../core/models/responses/frequencia-resumo.response';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AlunoService {
  private readonly apiUrl = `${environment.apiUrl}/aluno`;

  private alunoAtualizado = new Subject<void>();
  alunoAtualizado$ = this.alunoAtualizado.asObservable();

  constructor(private http: HttpClient) {}

  findAll(): Observable<AlunoResponse[]> {
    return this.http.get<AlunoResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<AlunoResponse> {
    return this.http.get<AlunoResponse>(`${this.apiUrl}/${id}`);
  }

  save(request: AlunoRequest): Observable<AlunoResponse> {
    return this.http
      .post<AlunoResponse>(this.apiUrl, request)
      .pipe(tap(() => this.alunoAtualizado.next()));
  }

  update(id: number, request: AlunoRequest): Observable<AlunoResponse> {
    return this.http
      .put<AlunoResponse>(`${this.apiUrl}/${id}`, request)
      .pipe(tap(() => this.alunoAtualizado.next()));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.alunoAtualizado.next()));
  }

  getFrequencias(id: number): Observable<FrequenciaResumoResponse[]> {
    return this.http.get<FrequenciaResumoResponse[]>(`${this.apiUrl}/${id}/frequencias`);
  }
}
