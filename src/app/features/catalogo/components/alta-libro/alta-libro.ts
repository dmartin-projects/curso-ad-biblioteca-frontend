import { Component, output } from '@angular/core';
import { Autofocus } from '../../../../shared/directives/autofocus';

/**
 * Esqueleto del alta: el formulario de verdad (Signal Forms) llega en el módulo 53.
 * Presentational: la página solo lo muestra a quien puede dar de alta libros.
 */
@Component({
  selector: 'app-alta-libro',
  imports: [Autofocus],
  templateUrl: './alta-libro.html',
})
export class AltaLibro {
  readonly cerrar = output<void>();
}
