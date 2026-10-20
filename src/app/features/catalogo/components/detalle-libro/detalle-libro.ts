import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { Pestana } from '../../../../shared/components/pestanas/pestana';
import { Pestanas } from '../../../../shared/components/pestanas/pestanas';
import { Tarjeta } from '../../../../shared/components/tarjeta/tarjeta';
import { LibroDetalle } from '../../interfaces/catalogo.models';

@Component({
  selector: 'app-detalle-libro',
  imports: [Tarjeta, Pestanas, Pestana, DatePipe],
  templateUrl: './detalle-libro.html',
})
export class DetalleLibro {
  readonly libro = input.required<LibroDetalle>();
  readonly reservar = output<number>();
  protected readonly autores = computed(() =>
    this.libro()
      .autores.map((a) => `${a.nombre} ${a.apellidos ?? ''}`.trim())
      .join(', '),
  );
}
