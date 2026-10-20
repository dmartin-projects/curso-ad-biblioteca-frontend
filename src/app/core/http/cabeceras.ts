import { HttpInterceptorFn } from '@angular/common/http';
import { inject, LOCALE_ID } from '@angular/core';

/**
 * Un id por petición para correlacionar con los logs de Django (módulo 30). crypto.randomUUID solo
 * existe en contextos seguros (https y localhost): abriendo la app como http://192.168.1.20:4200
 * desde el móvil no está, y sin la alternativa fallarían TODAS las peticiones.
 */
export const idDePeticion = (): string =>
  crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export const cabecerasInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) return next(req); // solo nuestra API
  return next(
    req.clone({
      setHeaders: {
        'Accept-Language': inject(LOCALE_ID), // módulo 28
        'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
        'X-Request-ID': idDePeticion(), // módulo 30
      },
    }),
  );
};
