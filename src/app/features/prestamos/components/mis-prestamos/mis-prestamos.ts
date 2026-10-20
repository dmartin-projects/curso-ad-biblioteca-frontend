import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { Lista } from '../../../../shared/components/lista/lista';
import { PrestamoResumen } from '../../interfaces/prestamos.models';

/** La misma Lista<T> que el catálogo, con otra plantilla de fila. */
@Component({
  selector: 'app-mis-prestamos',
  imports: [Lista, DatePipe],
  templateUrl: './mis-prestamos.html',
})
export class MisPrestamos {
  readonly prestamos = input.required<readonly PrestamoResumen[]>();
  protected readonly porId = (p: PrestamoResumen) => p.id;
}
