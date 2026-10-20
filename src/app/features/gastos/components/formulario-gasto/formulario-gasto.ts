import { Component } from '@angular/core';
import { EstadoFormularioGasto } from './estado-formulario-gasto';
import { LineasGasto } from './lineas-gasto/lineas-gasto';
import { ResumenGasto } from './resumen-gasto/resumen-gasto';

@Component({
  selector: 'app-formulario-gasto',
  providers: [EstadoFormularioGasto], // cada formulario abierto tiene SU estado
  imports: [LineasGasto, ResumenGasto],
  templateUrl: './formulario-gasto.html',
})
export class FormularioGasto {}
