import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Component, model, output } from '@angular/core';
import { Categoria } from '../selector-categoria/selector-categoria';

/** Ejercicio 5: reordenar con drag and drop… y con botones (el arrastre no es accesible por teclado). */
@Component({
  selector: 'app-orden-categorias',
  imports: [CdkDropList, CdkDrag, CdkDragHandle, CdkDragPlaceholder],
  templateUrl: './orden-categorias.html',
  styleUrl: './orden-categorias.scss',
})
export class OrdenCategorias {
  readonly categorias = model.required<Categoria[]>();
  readonly reordenado = output<number[]>();

  protected soltar(e: CdkDragDrop<Categoria[]>): void {
    this.mover(e.previousIndex, e.currentIndex);
  }

  protected mover(desde: number, hasta: number): void {
    if (desde === hasta) return;
    const copia = [...this.categorias()];
    moveItemInArray(copia, desde, hasta);
    this.categorias.set(copia);
    this.reordenado.emit(copia.map((c) => c.id)); // el padre guarda el nuevo orden en la API
  }
}
