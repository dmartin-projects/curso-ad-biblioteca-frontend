import { Component, inject, signal } from '@angular/core';
import { EventosGastos } from '../../features/gastos/services/eventos-gastos';
import { GraficoGastos } from './grafico-gastos';
import { ListaGastosFuga, ListaGastosTud } from './listas-gastos';
import { Reloj } from './reloj';

/** Pantalla de laboratorio (/fugas): monta y desmonta componentes para medir con DevTools. */
@Component({
  selector: 'app-lab-fugas',
  imports: [ListaGastosFuga, ListaGastosTud, GraficoGastos, Reloj],
  templateUrl: './lab-fugas.html',
})
export class LabFugas {
  private readonly eventos = inject(EventosGastos);
  readonly fuga = signal(false);
  readonly tud = signal(false);
  readonly grafico = signal(false);
  readonly graficoSin = signal(false);

  guardar(): void {
    this.eventos.notificarGuardado({ id: Date.now(), concepto: 'demo' });
  }
}
