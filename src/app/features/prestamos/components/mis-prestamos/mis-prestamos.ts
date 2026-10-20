import { DatePipe, I18nPluralPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { Lista } from '../../../../shared/components/lista/lista';
import { TiempoRelativoPipe } from '../../../../shared/pipes/tiempo-relativo';
import { PrestamoResumen } from '../../interfaces/prestamos.models';

/** La misma Lista<T> que el catálogo, con otra plantilla de fila. */
@Component({
  selector: 'app-mis-prestamos',
  imports: [Lista, DatePipe, I18nPluralPipe, TiempoRelativoPipe],
  templateUrl: './mis-prestamos.html',
})
export class MisPrestamos {
  readonly prestamos = input.required<readonly PrestamoResumen[]>();
  /** "Ahora" inyectable: en producción Date.now(), en los tests una fecha fija. */
  readonly ahora = input(Date.now());
  protected readonly porId = (p: PrestamoResumen) => p.id;
  protected readonly plural = {
    '=0': 'Sin préstamos',
    '=1': '1 préstamo',
    other: '# préstamos',
  };
}
