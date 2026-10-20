import { Component, inject } from '@angular/core';
import { EstadoFormularioGasto } from '../estado-formulario-gasto';

@Component({
  selector: 'app-lineas-gasto',
  templateUrl: './lineas-gasto.html',
})
export class LineasGasto {
  protected readonly estado = inject(EstadoFormularioGasto); // la instancia del formulario padre
}
