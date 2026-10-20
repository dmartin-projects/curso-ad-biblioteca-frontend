import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  exhaustMap,
  map,
  Observable,
  of,
  switchMap,
} from 'rxjs';

/** Ejercicio 2: el operador del autocompletado, independiente del componente (fácil de testear). */
export function autocompletar<T>(
  buscar: (termino: string) => Observable<T[]>,
  alFallar: (e: unknown) => void = () => {},
) {
  return (termino$: Observable<string>): Observable<T[]> =>
    termino$.pipe(
      map((t) => t.trim()),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((t) =>
        t.length < 2
          ? of([]) // por debajo de 2 letras, lista vacía (y cancela la búsqueda en curso)
          : buscar(t).pipe(
              catchError((e) => {
                alFallar(e);
                return of([]); // DENTRO del switchMap: el flujo exterior sigue vivo
              }),
            ),
      ),
    );
}

/** Ejercicio 4: los clics mientras hay un guardado en curso se ignoran. */
export function guardarSinDobles<R>(guardar: () => Observable<R>) {
  return (clics$: Observable<unknown>): Observable<R> => clics$.pipe(exhaustMap(() => guardar()));
}

/** Ejercicio 5: cualquier cambio en filtros, página u orden recarga; la petición anterior se cancela. */
export interface Consulta<F> {
  filtros: F;
  pagina: number;
  orden: string;
}
export function listadoCombinado<F, R>(
  filtros$: Observable<F>,
  pagina$: Observable<number>,
  orden$: Observable<string>,
  listar: (c: Consulta<F>) => Observable<R>,
): Observable<R> {
  return combineLatest([filtros$, pagina$, orden$]).pipe(
    switchMap(([filtros, pagina, orden]) => listar({ filtros, pagina, orden })),
  );
}
