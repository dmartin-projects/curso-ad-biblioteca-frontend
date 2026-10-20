import { Component, input } from '@angular/core';

@Component({
  selector: 'app-widget-aviso',
  templateUrl: './widget-aviso.html',
})
export class WidgetAviso {
  readonly config = input.required<{ texto: string }>();
}
