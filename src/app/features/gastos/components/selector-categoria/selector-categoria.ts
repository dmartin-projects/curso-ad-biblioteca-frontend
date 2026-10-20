import { Component, input, model, output } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';

export interface Categoria {
  id: number;
  nombre: string;
  color: string;
}

/**
 * Control propio para Signal Forms: basta con un model() llamado value.
 *
 * Por dentro, <input type="radio"> nativos en un <fieldset> con <legend>: el navegador da las
 * flechas, un solo Tab para todo el grupo y su nombre accesible. Con <button role="radio"> habría
 * que programar todo eso a mano (roving tabindex).
 */
@Component({
  selector: 'app-selector-categoria',
  templateUrl: './selector-categoria.html',
  styleUrl: './selector-categoria.scss',
})
export class SelectorCategoria implements FormValueControl<number | null> {
  private static siguiente = 0;
  protected readonly nombre = `categoria-${SelectorCategoria.siguiente++}`; // un name por grupo

  readonly value = model<number | null>(null); // obligatorio: valor en ambos sentidos
  readonly disabled = input(false); // opcionales: el formulario los rellena…
  readonly invalid = input(false);
  readonly touch = output<void>(); // …y este avisa de que el usuario lo ha "tocado"
  readonly categorias = input.required<Categoria[]>();
}
