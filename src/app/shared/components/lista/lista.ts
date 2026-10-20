import { NgTemplateOutlet } from '@angular/common';
import { Component, contentChild, input, TemplateRef } from '@angular/core';

export interface FilaContexto<T> {
  $implicit: T; // let-item
  indice: number; // let-i="indice"
}

/** Lista genérica: el padre decide cómo se pinta cada fila con <ng-template #fila>. */
@Component({
  selector: 'app-lista',
  imports: [NgTemplateOutlet],
  templateUrl: './lista.html',
})
export class Lista<T> {
  readonly items = input.required<readonly T[]>();
  readonly trackBy = input<(item: T) => unknown>((item) => item);
  protected readonly plantillaFila = contentChild<TemplateRef<FilaContexto<T>>>('fila');
}
