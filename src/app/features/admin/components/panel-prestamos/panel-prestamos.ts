import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FiltroPrestamos, Prestamo } from '../../interfaces/admin.models';

/**
 * Panel de préstamos para el personal. Presentational: pinta lo que le da la página (que lo saca
 * del PrestamosStore) y avisa de lo que hace el usuario.
 */
@Component({
  selector: 'app-panel-prestamos',
  imports: [DatePipe],
  templateUrl: './panel-prestamos.html',
})
export class PanelPrestamos {
  readonly prestamos = input.required<readonly Prestamo[]>();
  readonly filtro = input.required<FiltroPrestamos>();
  readonly busqueda = input('');
  readonly cargando = input(false);
  readonly error = input<string | null>(null);
  readonly totalVencidos = input(0);

  readonly cambiarFiltro = output<FiltroPrestamos>();
  readonly buscar = output<string>();
  readonly devolver = output<number>();

  protected readonly filtros: readonly FiltroPrestamos[] = ['activos', 'vencidos', 'todos'];
}
