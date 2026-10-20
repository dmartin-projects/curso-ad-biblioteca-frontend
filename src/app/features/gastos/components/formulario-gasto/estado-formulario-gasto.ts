import { computed, Service, signal } from '@angular/core';

export interface LineaGasto {
  concepto: string;
  importe: number;
}

/** NO auto-provisto: cada FormularioGasto crea el suyo en `providers`. */
@Service({ autoProvided: false })
export class EstadoFormularioGasto {
  readonly lineas = signal<LineaGasto[]>([]);
  readonly total = computed(() => this.lineas().reduce((s, l) => s + l.importe, 0));

  anadir(linea: LineaGasto): void {
    this.lineas.update((l) => [...l, linea]);
  }
}
