import { Directive, ElementRef, inject, output } from '@angular/core';

@Directive({
  selector: '[appClickFuera]',
  host: { '(document:click)': 'alHacerClic($event)' }, // se quita solo al destruir: sin fugas
})
export class ClickFuera {
  readonly appClickFuera = output<void>();
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  protected alHacerClic(evento: MouseEvent): void {
    if (!this.el.nativeElement.contains(evento.target as Node)) {
      this.appClickFuera.emit();
    }
  }
}
