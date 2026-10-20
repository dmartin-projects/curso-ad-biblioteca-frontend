import { Component, input, linkedSignal, output } from '@angular/core';

export interface Hogar {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-selector-hogar',
  templateUrl: './selector-hogar.html',
})
export class SelectorHogar {
  readonly hogares = input.required<Hogar[]>();
  /** El que debe aparecer elegido de entrada (por ejemplo, el hogar activo de un store). */
  readonly inicialId = input<number | null | undefined>(null);
  readonly cambio = output<Hogar>();

  /** Escribible por el usuario, pero se recalcula cuando cambia la lista: conserva la selección
   * si el hogar sigue existiendo; si no, el primero. */
  readonly seleccionado = linkedSignal<Hogar[], Hogar | undefined>({
    source: this.hogares,
    computation: (hogares, anterior) =>
      hogares.find((h) => h.id === anterior?.value?.id) ??
      hogares.find((h) => h.id === this.inicialId()) ??
      hogares[0],
  });

  elegir(id: string): void {
    const hogar = this.hogares().find((h) => h.id === Number(id));
    if (hogar) {
      this.seleccionado.set(hogar);
      this.cambio.emit(hogar);
    }
  }
}
