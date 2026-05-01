import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';

import { AlunoRequest } from '../../../core/models/requests/aluno.request';
import { AlunoResponse } from '../../../core/models/responses/aluno.response';
import { AlunoDetalheResponse } from '../../../core/models/responses/aluno-detalhe.response';
import { FrequenciaResumoResponse } from '../../../core/models/responses/frequencia-resumo.response';
import { AlunoSituacaoResponse } from '../../../core/models/responses/aluno-situacao.response';
import { DocumentoStatusResponse, TipoDocumento } from '../../../core/models/responses/documento-status.response';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AlunoService {
  private readonly apiUrl = `${environment.apiUrl}/aluno`;
  private http = inject(HttpClient);

  private alunoAtualizado = new Subject<void>();
  alunoAtualizado$ = this.alunoAtualizado.asObservable();

  findAll(): Observable<AlunoResponse[]> {
    return this.http.get<AlunoResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<AlunoDetalheResponse> {
    return this.http.get<AlunoDetalheResponse>(`${this.apiUrl}/${id}`);
  }

  search(q: string): Observable<AlunoResponse[]> {
    return this.http.get<AlunoResponse[]>(this.apiUrl, {
      params: new HttpParams().set('search', q),
    });
  }

  save(request: AlunoRequest): Observable<AlunoResponse> {
    return this.http.post<AlunoResponse>(this.apiUrl, request)
      .pipe(tap(() => this.alunoAtualizado.next()));
  }

  update(id: number, request: AlunoRequest): Observable<AlunoResponse> {
    return this.http.put<AlunoResponse>(`${this.apiUrl}/${id}`, request)
      .pipe(tap(() => this.alunoAtualizado.next()));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.alunoAtualizado.next()));
  }

  getFrequencias(id: number): Observable<FrequenciaResumoResponse[]> {
    return this.http.get<FrequenciaResumoResponse[]>(`${this.apiUrl}/${id}/frequencias`);
  }

  getSituacao(id: number): Observable<AlunoSituacaoResponse> {
    return this.http.get<AlunoSituacaoResponse>(`${this.apiUrl}/${id}/situacao`);
  }

  getPendenciasResumo(): Observable<{ alunosDocPendentes: number; alunosInfoPendente: number; totalAlunos: number }> {
    return this.http.get<{ alunosDocPendentes: number; alunosInfoPendente: number; totalAlunos: number }>(
      `${this.apiUrl}/pendencias-resumo`
    );
  }

  getDocumentosStatus(id: number): Observable<DocumentoStatusResponse[]> {
    return this.http.get<DocumentoStatusResponse[]>(`${environment.apiUrl}/documento/aluno/${id}/status`);
  }

  toggleDocumento(alunoId: number, tipo: TipoDocumento, entregue: boolean): Observable<DocumentoStatusResponse> {
    return this.http.put<DocumentoStatusResponse>(
      `${environment.apiUrl}/documento/aluno/${alunoId}/tipo/${tipo}`,
      null,
      { params: new HttpParams().set('entregue', String(entregue)) }
    );
  }
}
