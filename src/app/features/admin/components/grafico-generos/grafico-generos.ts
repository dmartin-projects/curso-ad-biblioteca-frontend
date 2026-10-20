import { Component, computed, input } from '@angular/core';
import type { ChartData } from 'chart.js';
import { Grafico } from '../../../../shared/components/grafico/grafico';
import { LibrosPorGenero } from '../../interfaces/admin.models';

/** Módulo 61: libros por género. Presentational: recibe las filas y las pasa al formato de Chart.js. */
@Component({
  selector: 'app-grafico-generos',
  imports: [Grafico],
  templateUrl: './grafico-generos.html',
})
export class GraficoGeneros {
  readonly filas = input.required<readonly LibrosPorGenero[]>();

  /** De la API al formato de Chart.js, en un computed: el gráfico solo recibe datos ya listos. */
  protected readonly datos = computed<ChartData | null>(() => {
    const filas = this.filas();
    if (filas.length === 0) return null;
    return {
      labels: filas.map((f) => f.genero),
      datasets: [{ label: 'Libros', data: filas.map((f) => f.libros) }],
    };
  });
}
