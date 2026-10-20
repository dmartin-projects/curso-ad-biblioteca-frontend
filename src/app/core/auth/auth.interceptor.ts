import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { SIN_AUTH } from '../http/contexto';
import { AuthStore, esSesionRechazada } from './auth-store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/') || req.context.get(SIN_AUTH)) return next(req);

  const auth = inject(AuthStore);
  const conToken = (r: HttpRequest<unknown>, token: string | null) =>
    token ? r.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : r;

  return next(conToken(req, auth.access())).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }
      // access caducado: refrescar (una sola vez para todas) y reintentar la petición original
      return auth.refrescar().pipe(
        switchMap((nuevo) => next(conToken(req, nuevo))),
        catchError((e) => {
          // el refresh también falló. Si el servidor rechazó la sesión, se cierra (sesionCaducada);
          // si fue un fallo transitorio (red, 5xx, 429, timeout), solo falla esta petición
          if (esSesionRechazada(e)) auth.sesionCaducada();
          return throwError(() => e);
        }),
      );
    }),
  );
};
