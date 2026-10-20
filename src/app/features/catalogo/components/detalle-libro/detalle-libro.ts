import { DatePipe } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { Tab, TabContent, TabList, TabPanel, Tabs } from '@angular/aria/tabs';
import { Tarjeta } from '../../../../shared/components/tarjeta/tarjeta';
import { LibroDetalle } from '../../interfaces/catalogo.models';

@Component({
  selector: 'app-detalle-libro',
  imports: [Tarjeta, Tabs, TabList, Tab, TabPanel, TabContent, DatePipe],
  templateUrl: './detalle-libro.html',
})
export class DetalleLibro {
  readonly libro = input.required<LibroDetalle>();
  readonly reservar = output<number>();
  protected readonly pestanas = [
    { valor: 'datos', titulo: 'Datos' },
    { valor: 'sinopsis', titulo: 'Sinopsis' },
  ];
  protected readonly pestana = signal('datos');
  protected readonly autores = computed(() =>
    this.libro()
      .autores.map((a) => `${a.nombre} ${a.apellidos ?? ''}`.trim())
      .join(', '),
  );
}
