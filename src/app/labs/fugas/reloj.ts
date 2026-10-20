import { Component, DestroyRef, inject, signal } from '@angular/core';

/** Ejercicio 3: setInterval + resize de window, ambos limpiados. */
@Component({
  selector: 'app-reloj',
  host: { '(window:resize)': 'ancho.set($any($event.target).innerWidth)' }, // Angular lo quita solo
  templateUrl: './reloj.html',
})
export class Reloj {
  readonly segundos = signal(0);
  readonly ancho = signal(window.innerWidth);

  constructor() {
    const id = setInterval(() => this.segundos.update((s) => s + 1), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }
}
