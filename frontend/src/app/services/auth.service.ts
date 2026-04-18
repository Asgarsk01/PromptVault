import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, of, tap } from 'rxjs';

import { environment } from '../../environments/environment';

type TokenResponse = {
  access: string;
  refresh: string;
  user?: AuthUser;
};

type AuthUser = {
  id: number;
  username: string;
  email: string;
  full_name: string;
  display_name: string;
};

type SignupPayload = {
  full_name: string;
  email: string;
  username: string;
  password: string;
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly signupUrl = `${environment.apiUrl}/auth/signup/`;
  private readonly tokenUrl = `${environment.apiUrl}/auth/token/`;
  private readonly refreshUrl = `${environment.apiUrl}/auth/token/refresh/`;
  private readonly logoutUrl = `${environment.apiUrl}/auth/logout/`;
  private readonly accessTokenKey = 'promptvault_access_token';
  private readonly refreshTokenKey = 'promptvault_refresh_token';
  private readonly displayNameKey = 'promptvault_display_name';
  private readonly usernameKey = 'promptvault_username';
  private readonly emailKey = 'promptvault_email';

  login(identifier: string, password: string): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(this.tokenUrl, { username: identifier, password }).pipe(
      tap((tokens) => {
        this.storeSession(tokens, identifier);
      })
    );
  }

  signup(payload: SignupPayload): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(this.signupUrl, payload).pipe(
      tap((tokens) => {
        this.storeSession(tokens, payload.username);
      })
    );
  }

  logout(): void {
    const refresh = this.getRefreshToken();

    const finalizeLogout = () => {
      localStorage.removeItem(this.accessTokenKey);
      localStorage.removeItem(this.refreshTokenKey);
      localStorage.removeItem(this.displayNameKey);
      localStorage.removeItem(this.usernameKey);
      localStorage.removeItem(this.emailKey);
      void this.router.navigate(['/login']);
    };

    if (!refresh) {
      finalizeLogout();
      return;
    }

    this.http.post(this.logoutUrl, { refresh }).pipe(
      catchError(() => of(null))
    ).subscribe({
      next: () => finalizeLogout()
    });
  }

  getAccessToken(): string {
    return localStorage.getItem(this.accessTokenKey) ?? '';
  }

  getRefreshToken(): string {
    return localStorage.getItem(this.refreshTokenKey) ?? '';
  }

  getUsername(): string {
    return localStorage.getItem(this.usernameKey) ?? '';
  }

  getDisplayName(): string {
    return localStorage.getItem(this.displayNameKey) ?? this.getUsername();
  }

  getEmail(): string {
    return localStorage.getItem(this.emailKey) ?? '';
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  refreshToken(): Observable<{ access: string }> {
    return this.http.post<{ access: string }>(this.refreshUrl, {
      refresh: this.getRefreshToken()
    }).pipe(
      tap((response) => {
        localStorage.setItem(this.accessTokenKey, response.access);
      })
    );
  }

  private storeSession(tokens: TokenResponse, fallbackUsername: string): void {
    localStorage.setItem(this.accessTokenKey, tokens.access);
    localStorage.setItem(this.refreshTokenKey, tokens.refresh);

    const username = tokens.user?.username ?? fallbackUsername;
    const email = tokens.user?.email ?? '';
    const displayName = tokens.user?.display_name ?? username;

    localStorage.setItem(this.usernameKey, username);
    localStorage.setItem(this.emailKey, email);
    localStorage.setItem(this.displayNameKey, displayName);
  }
}
