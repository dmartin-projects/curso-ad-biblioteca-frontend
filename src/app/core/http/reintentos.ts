import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { retry, throwError, timer } from 'rxjs';

/** Reintenta solo GET (idempotente) y solo errores transitorios. */
export const reintentosInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') return next(req);
  return next(req).pipe(
    retry({
      count: 2,
      delay: (e, intento) =>
        e instanceof HttpErrorResponse && [0, 502, 503, 504].includes(e.status)
          ? timer(500 * 2 ** intento)
          : throwError(() => e),
    }),
  );
};
