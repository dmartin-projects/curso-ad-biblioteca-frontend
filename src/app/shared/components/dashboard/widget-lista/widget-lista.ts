import { Component, input } from '@angular/core';

@Component({
  selector: 'app-widget-lista',
  templateUrl: './widget-lista.html',
})
export class WidgetLista {
  readonly config = input.required<{ lineas: string[] }>();
}
