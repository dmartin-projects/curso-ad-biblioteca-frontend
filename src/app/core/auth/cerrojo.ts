import { defer, firstValueFrom, Observable, timeout } from 'rxjs';

/**
 * Ejecuta `peticion` en exclusiva entre TODAS las pestañas del mismo origen (Web Locks API): si
 * otra pestaña tiene el cerrojo `nombre`, espera a que lo suelte. Sin la API (jsdom en los tests),
 * la deja tal cual: dentro de una pestaña ya hay un solo refresh (shareReplay).
 *
 * Con un límite: HttpClient no tiene timeout, y una petición colgada retendría el cerrojo (y a las
 * pestañas que esperan) hasta cerrar la pestaña. Pasado `limiteMs` falla con TimeoutError.
 */
export function conCerrojo<T>(
  nombre: string,
  peticion: Observable<T>,
  limiteMs = 15_000,
): Observable<T> {
  const conLimite = peticion.pipe(timeout(limiteMs));
  const locks = globalThis.navigator?.locks;
  return locks ? defer(() => locks.request(nombre, () => firstValueFrom(conLimite))) : conLimite;
}
