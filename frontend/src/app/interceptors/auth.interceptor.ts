import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const accessToken = authService.getAccessToken();
  const isTokenRefreshRequest = req.url.includes('/auth/token/refresh/');
  const isLoginRequest = req.url.includes('/auth/token/');

  const authorizedRequest = accessToken
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`
        }
      })
    : req;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || isLoginRequest || isTokenRefreshRequest) {
        if (error instanceof HttpErrorResponse && error.status === 401 && (isLoginRequest || isTokenRefreshRequest)) {
          authService.logout();
        }

        return throwError(() => error);
      }

      const refreshToken = authService.getRefreshToken();
      if (!refreshToken) {
        authService.logout();
        return throwError(() => error);
      }

      return authService.refreshToken().pipe(
        switchMap(({ access }) =>
          next(
            req.clone({
              setHeaders: {
                Authorization: `Bearer ${access}`
              }
            })
          )
        ),
        catchError((refreshError) => {
          authService.logout();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
