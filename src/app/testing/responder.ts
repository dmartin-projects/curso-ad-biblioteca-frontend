import { HttpRequest } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';

/**
 * Espera a que llegue una petición a `url` (sin contar los query params) y la responde.
 * Necesario cuando un httpResource (que dispara su petición de forma asíncrona) impide
 * que whenStable() termine. Devuelve la petición para comprobar parámetros o cabeceras.
 */
export async function responder(
  http: HttpTestingController,
  url: string,
  cuerpo: unknown,
  opciones?: { status: number; statusText: string },
): Promise<HttpRequest<unknown>> {
  for (let i = 0; i < 100; i++) {
    const peticiones = http.match((r) => r.url === url);
    if (peticiones.length) {
      peticiones.forEach((p) => p.flush(cuerpo as never, opciones));
      return peticiones[0].request;
    }
    await new Promise((r) => setTimeout(r, 5));
  }
  throw new Error(`No ha llegado ninguna petición a ${url}`);
}

/**
 * Espera (máx. 1 s) a que se cumpla una condición sobre lo pintado. Útil con librerías que
 * actualizan sus signals al resolver una Promise, después de que whenStable() haya terminado
 * (TanStack Query).
 */
export async function hastaQue(
  fixture: { whenStable(): Promise<unknown> },
  condicion: () => boolean,
): Promise<void> {
  for (let i = 0; i < 200; i++) {
    await fixture.whenStable();
    if (condicion()) return;
    await new Promise((r) => setTimeout(r, 5));
  }
  throw new Error('La condición no se cumplió a tiempo');
}
