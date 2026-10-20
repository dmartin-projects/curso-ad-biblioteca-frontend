import { Component, input } from '@angular/core';

@Component({
  selector: 'app-widget-total',
  templateUrl: './widget-total.html',
})
export class WidgetTotal {
  readonly config = input.required<{ total: number; etiqueta: string }>();
}
