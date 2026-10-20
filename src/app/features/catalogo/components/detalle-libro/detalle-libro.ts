import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Pestana } from '../../../../shared/components/pestanas/pestana';
import { Pestanas } from '../../../../shared/components/pestanas/pestanas';
import { Tarjeta } from '../../../../shared/components/tarjeta/tarjeta';
import { Libro } from '../../interfaces/catalogo.models';

@Component({
  selector: 'app-detalle-libro',
  imports: [Tarjeta, Pestanas, Pestana, DatePipe],
  templateUrl: './detalle-libro.html',
})
export class DetalleLibro {
  readonly libro = input.required<Libro>();
  readonly reservar = output<number>();
}
