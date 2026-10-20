import { HttpContextToken, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { of, tap } from 'rxjs';

/** TTL en ms; 0 = no cachear (opt-in por petición). */
export const CACHEAR = new HttpContextToken<number>(() => 0);

interface Entrada {
  respuesta: HttpResponse<unknown>;
  caduca: number;
}

@Service()
export class CacheHttp {
  private readonly entradas = new Map<string, Entrada>();
  readonly maximo = 100;

  get tamano(): number {
    return this.entradas.size;
  }

  obtener(clave: string): HttpResponse<unknown> | undefined {
    const e = this.entradas.get(clave);
    if (!e) return undefined;
    if (e.caduca < Date.now()) {
      this.entradas.delete(clave);
      return undefined;
    }
    this.entradas.delete(clave); // LRU: la vuelve a poner al final (la más reciente)
    this.entradas.set(clave, e);
    return e.respuesta;
  }

  guardar(clave: string, respuesta: HttpResponse<unknown>, ttl: number): void {
    if (this.entradas.size >= this.maximo) {
      this.entradas.delete(this.entradas.keys().next().value!); // expulsa la menos usada
    }
    this.entradas.set(clave, { respuesta, caduca: Date.now() + ttl });
  }

  /** Invalida todo lo que empiece por un prefijo de URL. */
  invalidar(prefijo: string): void {
    for (const clave of [...this.entradas.keys()]) {
      if (clave.startsWith(prefijo)) this.entradas.delete(clave);
    }
  }

  limpiar(): void {
    this.entradas.clear();
  }
}

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const cache = inject(CacheHttp);

  // Cualquier escritura (que salga bien) invalida la caché de ese recurso
  if (req.method !== 'GET') {
    const recurso = req.url.replace(/\/\d+\/.*$/, '/'); // /api/v1/libros/7/portada/ → /api/v1/libros/
    return next(req).pipe(
      tap((ev) => {
        if (ev instanceof HttpResponse) cache.invalidar(recurso); // la respuesta, no el evento Sent
      }),
    );
  }

  const ttl = req.context.get(CACHEAR);
  if (!ttl) return next(req);

  const clave = req.urlWithParams;
  const enCache = cache.obtener(clave);
  if (enCache) return of(enCache.clone());

  return next(req).pipe(
    tap((ev) => {
      if (ev instanceof HttpResponse) cache.guardar(clave, ev, ttl);
    }),
  );
};
