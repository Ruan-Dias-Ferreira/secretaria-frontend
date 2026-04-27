// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';
import { LoginRequest } from '../models/requests/login.request';
import { UsuarioResponse } from '../models/responses/usuario.response';
import { Role } from '../models/enums/role.enum';

interface JwtPayload {
  sub: string;   
  role: Role;   
  exp: number;  
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly TOKEN_KEY = 'auth_token';
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<UsuarioResponse | null>(
    this.getUserFromToken()
  );
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/login`, credentials, { responseType: 'text' }).pipe(
      tap(token => {
        localStorage.setItem(this.TOKEN_KEY, token);
        this.currentUserSubject.next(this.getUserFromToken());
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): UsuarioResponse | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = jwtDecode<JwtPayload>(token);
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  hasRole(role: Role): boolean {
    return this.getCurrentUser()?.role === role;
  }

  private getUserFromToken(): UsuarioResponse | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = jwtDecode<JwtPayload>(token);
      return { login: payload.sub, role: payload.role };
    } catch {
      return null;
    }
  }
}