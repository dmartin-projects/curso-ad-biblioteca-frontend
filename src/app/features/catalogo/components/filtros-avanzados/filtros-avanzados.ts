import { Component, input, output } from '@angular/core';

export interface RangoPublicacion {
  desde: string | null;
  hasta: string | null;
}

/** Panel de filtros avanzados (se carga con @defer: muchos usuarios nunca lo abren). */
@Component({
  selector: 'app-filtros-avanzados',
  templateUrl: './filtros-avanzados.html',
})
export class FiltrosAvanzados {
  readonly rango = input<RangoPublicacion>({ desde: null, hasta: null });
  readonly cambio = output<RangoPublicacion>();
}
