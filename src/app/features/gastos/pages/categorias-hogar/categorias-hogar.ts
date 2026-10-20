import { Component, inject, input } from '@angular/core';
import { HogaresApi } from '../../services/hogares-api';

/** Un hogar y sus categorías: dos recursos encadenados (los crea HogaresApi). */
@Component({
  selector: 'app-categorias-hogar',
  templateUrl: './categorias-hogar.html',
})
export class CategoriasHogar {
  private readonly api = inject(HogaresApi);
  readonly hogarId = input.required<number>();

  readonly hogar = this.api.hogar(this.hogarId);
  readonly categorias = this.api.categorias(this.hogar);
}
