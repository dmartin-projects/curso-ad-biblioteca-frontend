import { NgComponentOutlet } from '@angular/common';
import { Component, input, Type } from '@angular/core';
import { ConfigWidget, TipoWidget, WIDGETS } from './widgets';

/** Qué widgets y en qué orden lo decide una configuración (del usuario, de la API…). */
@Component({
  selector: 'app-dashboard',
  imports: [NgComponentOutlet],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  // Type<unknown>: con el tipo exacto (una unión de clases), la plantilla no compila (TS2322)
  protected readonly tipos: Record<TipoWidget, Type<unknown>> = WIDGETS;
  readonly widgets = input.required<readonly ConfigWidget[]>();
}
