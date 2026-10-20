import { Component, debounced, inject, signal } from '@angular/core';
import { AutoresApi } from '../autores-api';

/** Versión B: debounced (experimental) + el httpResource de AutoresApi contra la API real. */
@Component({
  selector: 'app-buscador-autores-http',
  templateUrl: './buscador-autores-http.html',
})
export class BuscadorAutoresHttp {
  readonly termino = signal('');
  private readonly terminoEstable = debounced(() => this.termino().trim(), 300);

  protected readonly autores = inject(AutoresApi).buscar(this.terminoEstable.value);
}
