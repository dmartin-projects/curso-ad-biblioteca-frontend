import { Component, inject, signal } from '@angular/core';
import { ClickFuera } from '../../directives/click-fuera';
import { Tooltip } from '../../directives/tooltip';

/** Botón con menú desplegable que COMPONE dos directivas en vez de heredar de ellas. */
@Component({
  selector: 'app-boton-menu',
  hostDirectives: [
    { directive: ClickFuera, outputs: ['appClickFuera: clickFuera'] },
    { directive: Tooltip, inputs: ['appTooltip: ayuda'] },
  ],
  host: { '(keydown.escape)': 'abierto.set(false)' },
  templateUrl: './boton-menu.html',
})
export class BotonMenu {
  readonly abierto = signal(false);

  constructor() {
    // El componente inyecta la directiva que compone y se coordina con ella. subscribe() de un
    // output() se cancela solo al destruir el componente.
    inject(ClickFuera).appClickFuera.subscribe(() => this.abierto.set(false));
  }
}
