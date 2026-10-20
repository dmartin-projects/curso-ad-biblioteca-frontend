import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import type { Chart, ChartData, ChartOptions, ChartType } from 'chart.js';

/**
 * Módulo 61: envoltorio genérico de Chart.js. Las cuatro reglas: crear tras el render, actualizar
 * con un effect (sin recrear), destruir con DestroyRef y cargar la librería de forma diferida.
 */
@Component({
  selector: 'app-grafico',
  templateUrl: './grafico.html',
  host: { class: 'block relative' },
})
export class Grafico {
  readonly tipo = input<ChartType>('bar');
  readonly datos = input.required<ChartData>();
  readonly opciones = input<ChartOptions>({});
  readonly etiqueta = input('Gráfico');

  private readonly lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  private grafico?: Chart;
  private destruido = false;

  constructor() {
    afterNextRender(async () => {
      const { Chart, registerables } = await import('chart.js'); // fuera del bundle inicial
      // ⚠️ mientras se descargaba Chart.js, el usuario pudo irse de la página: sin esta comprobación
      // se crearía un gráfico sobre un <canvas> ya destruido… y nadie lo destruiría nunca
      if (this.destruido) return;
      Chart.register(...registerables);
      this.grafico = new Chart(this.lienzo().nativeElement, {
        type: this.tipo(),
        data: this.datos(),
        options: { responsive: true, maintainAspectRatio: false, ...this.opciones() },
      });
    });

    effect(() => {
      const datos = this.datos(); // se lee SIEMPRE: así el effect depende de los datos
      if (!this.grafico) return; // aún no creado: lo creará afterNextRender con los últimos datos
      this.grafico.data = datos;
      this.grafico.update(); // actualizar, no recrear
    });

    inject(DestroyRef).onDestroy(() => {
      this.destruido = true;
      this.grafico?.destroy();
    });
  }
}
