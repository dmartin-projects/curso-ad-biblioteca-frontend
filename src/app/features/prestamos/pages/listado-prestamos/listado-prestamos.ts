import { Component, inject, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Paginado, PrestamosApiFalsa } from '../../services/prestamos-api-falsa';
import { PrestamoResumen } from '../../interfaces/prestamos.models';

@Component({
  selector: 'app-listado-prestamos',
  templateUrl: './listado-prestamos.html',
})
export default class ListadoPrestamos {
  private readonly api = inject(PrestamosApiFalsa);
  readonly estado = signal<'activo' | 'devuelto' | ''>('');
  /** Al cambiar el filtro, vuelve a la página 1 (módulo 41). */
  readonly pagina = linkedSignal({ source: this.estado, computation: () => 1 });

  protected readonly prestamos = rxResource({
    params: () => ({ estado: this.estado(), pagina: this.pagina() }),
    stream: ({ params }) => this.api.listar(params), // se cancela si cambian los params
    defaultValue: { count: 0, results: [] } as Paginado<PrestamoResumen>,
  });
}
