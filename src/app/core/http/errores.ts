import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Problema } from '../api/tipos';
import { Avisos } from '../avisos/avisos';
import { SIN_AVISO_ERROR } from './contexto';

export class ErrorApi extends Error {
  constructor(
    readonly status: number,
    readonly tipo: string, // "validacion", "sin_permiso", "prestamo_ya_devuelto"…
    readonly titulo: string,
    readonly errores: Record<string, string[]> = {},
    readonly requestId?: string,
  ) {
    super(titulo);
  }
}

export const erroresInterceptor: HttpInterceptorFn = (req, next) => {
  const avisos = inject(Avisos);
  return next(req).pipe(
    catchError((e: unknown) => {
      if (!(e instanceof HttpErrorResponse)) return throwError(() => e);
      const p = e.error as Partial<Problema> | null;
      const error =
        e.status === 0
          ? new ErrorApi(0, 'sin_conexion', 'No se puede conectar con el servidor.')
          : new ErrorApi(
              e.status,
              p?.type ?? 'error',
              p?.title ?? 'Error inesperado.',
              p?.errors ?? {},
              p?.request_id,
            );

      // Avisos globales para lo que la pantalla no suele tratar
      if (!req.context.get(SIN_AVISO_ERROR) && [0, 403, 429, 500, 502, 503].includes(e.status)) {
        avisos.error(error.titulo, error.requestId); // con la referencia para soporte (módulo 30)
      }
      return throwError(() => error);
    }),
  );
};
