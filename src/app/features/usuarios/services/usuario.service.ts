import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';

import { UsuarioRequest } from '../../../core/models/requests/usuario.request';
import { UsuarioResponse } from '../../../core/models/responses/usuario.response';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly apiUrl = `${environment.apiUrl}/usuario`;

  private usuarioAtualizado = new Subject<void>();
  usuarioAtualizado$ = this.usuarioAtualizado.asObservable();

  constructor(private http: HttpClient) {}

  findAll(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.apiUrl}/${id}`);
  }

  save(request: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http
      .post<UsuarioResponse>(this.apiUrl, request)
      .pipe(tap(() => this.usuarioAtualizado.next()));
  }

  update(id: number, request: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http
      .put<UsuarioResponse>(`${this.apiUrl}/${id}`, request)
      .pipe(tap(() => this.usuarioAtualizado.next()));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.usuarioAtualizado.next()));
  }
}
