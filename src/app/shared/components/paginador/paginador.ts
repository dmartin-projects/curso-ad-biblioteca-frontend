import { Component, computed, input, model } from '@angular/core';

@Component({
  selector: 'app-paginador',
  templateUrl: './paginador.html',
})
export class Paginador {
  readonly total = input.required<number>();
  readonly tamano = input(20);
  readonly pagina = model(1);
  protected readonly paginas = computed(() => Math.max(1, Math.ceil(this.total() / this.tamano())));
}
