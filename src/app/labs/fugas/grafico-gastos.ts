import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

/** Ejercicio 4: Chart.js no conoce el ciclo de vida de Angular → destroy() a mano. */
@Component({
  selector: 'app-grafico-gastos',
  templateUrl: './grafico-gastos.html',
})
export class GraficoGastos {
  /** Solo para el laboratorio: con false se "olvida" el destroy() y se ve la fuga. */
  readonly destruir = input(true);
  private readonly lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  private grafico?: Chart;

  constructor() {
    afterNextRender(() => {
      this.grafico = new Chart(this.lienzo().nativeElement, {
        type: 'bar',
        data: {
          labels: ['Súper', 'Ocio', 'Casa'],
          datasets: [{ label: 'Gastos (€)', data: [320, 85, 640] }],
        },
        options: { responsive: true, maintainAspectRatio: false },
      });
    });
    inject(DestroyRef).onDestroy(() => {
      if (this.destruir()) this.grafico?.destroy();
    });
  }
}
