import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { EstadoFormularioGasto } from '../estado-formulario-gasto';

@Component({
  selector: 'app-resumen-gasto',
  imports: [CurrencyPipe],
  templateUrl: './resumen-gasto.html',
})
export class ResumenGasto {
  protected readonly estado = inject(EstadoFormularioGasto);
}
