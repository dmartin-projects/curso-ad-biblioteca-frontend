import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { AutoresApiFalsa } from '../autores-api-falsa';

/** Versión A: signal → toObservable → operadores RxJS → toSignal. Estable. */
@Component({
  selector: 'app-buscador-autores-signal',
  templateUrl: './buscador-autores-signal.html',
})
export class BuscadorAutoresSignal {
  private readonly api = inject(AutoresApiFalsa);
  readonly termino = signal('');

  protected readonly resultados = toSignal(
    toObservable(this.termino).pipe(
      map((t) => t.trim()),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((t) =>
        t.length < 2 ? of([]) : this.api.buscar(t).pipe(catchError(() => of([] as string[]))),
      ),
    ),
    { initialValue: [] as string[] },
  );
}
