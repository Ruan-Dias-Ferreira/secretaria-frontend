import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';

import { DocumentoRequest } from '../../../core/models/requests/documento.request';
import { DocumentoResponse } from '../../../core/models/responses/documento.response';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DocumentoService {
  private readonly apiUrl = `${environment.apiUrl}/documento`;
  private http = inject(HttpClient);

  private documentoAtualizado = new Subject<void>();
  documentoAtualizado$ = this.documentoAtualizado.asObservable();

  findAll(): Observable<DocumentoResponse[]> {
    return this.http.get<DocumentoResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<DocumentoResponse> {
    return this.http.get<DocumentoResponse>(`${this.apiUrl}/${id}`);
  }

  save(request: DocumentoRequest): Observable<DocumentoResponse> {
    return this.http
      .post<DocumentoResponse>(this.apiUrl, request)
      .pipe(tap(() => this.documentoAtualizado.next()));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.documentoAtualizado.next()));
  }
}
