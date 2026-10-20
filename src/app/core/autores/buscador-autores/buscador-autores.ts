import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { autocompletar } from '../../../shared/utils/flujos';
import { AutoresApiFalsa } from '../autores-api-falsa';

@Component({
  selector: 'app-buscador-autores',
  imports: [AsyncPipe],
  templateUrl: './buscador-autores.html',
})
export class BuscadorAutores {
  private readonly api = inject(AutoresApiFalsa);
  protected readonly termino$ = new Subject<string>();
  protected readonly error = signal('');

  /** El pipe async se suscribe y se desuscribe solo al destruir el componente. */
  protected readonly resultados$ = this.termino$.pipe(
    autocompletar(
      (t) => {
        this.error.set('');
        return this.api.buscar(t);
      },
      () => this.error.set('No se pudo buscar'),
    ),
  );
}
