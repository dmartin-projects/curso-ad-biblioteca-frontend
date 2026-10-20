import { afterNextRender, Directive, ElementRef, inject, input } from '@angular/core';

@Directive({ selector: '[appAutofocus]' })
export class Autofocus {
  /** <input appAutofocus /> enfoca; [appAutofocus]="false" no. */
  readonly activo = input(true, {
    alias: 'appAutofocus',
    transform: (v: boolean | '') => v !== false,
  });
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => {
      if (this.activo()) this.el.nativeElement.focus();
    });
  }
}
