import { Component, signal } from '@angular/core';

/** Panel desplegable que se cierra con Escape desde cualquier parte de la página. */
@Component({
  selector: 'app-panel-filtros',
  templateUrl: './panel-filtros.html',
  host: {
    '[class.abierto]': 'abierto()',
    '(document:keydown.escape)': 'cerrar()', // se elimina solo al destruir el componente
  },
})
export class PanelFiltros {
  readonly abierto = signal(false);

  protected cerrar(): void {
    this.abierto.set(false);
  }
}
