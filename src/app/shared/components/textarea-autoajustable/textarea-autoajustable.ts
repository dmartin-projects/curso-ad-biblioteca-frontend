import { afterRenderEffect, Component, ElementRef, model, viewChild } from '@angular/core';

/** Ejercicio 3: un textarea que crece y encoge con su contenido. */
@Component({
  selector: 'app-textarea-autoajustable',
  templateUrl: './textarea-autoajustable.html',
})
export class TextareaAutoajustable {
  readonly valor = model('');
  private readonly ta = viewChild.required<ElementRef<HTMLTextAreaElement>>('ta');

  constructor() {
    afterRenderEffect({
      // Para que también ENCOJA hay que quitar la altura y volver a medir: escribir y leer
      // en el mismo paso. Es justo para lo que existe la fase mixedReadWrite.
      mixedReadWrite: () => {
        this.valor(); // dependencia: se repite cada vez que cambia el texto
        const el = this.ta().nativeElement;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
      },
    });
  }
}
