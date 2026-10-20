import { Component, ElementRef, input, output, viewChild } from '@angular/core';
import { FiltrosLibro } from '../../interfaces/catalogo.models';

/** Presentación: no guarda estado propio. Recibe los filtros y emite los nuevos. */
@Component({
  selector: 'app-filtros-libros',
  templateUrl: './filtros-libros.html',
  host: { '(document:keydown)': 'atajo($event)' },
})
export class FiltrosLibros {
  readonly filtros = input.required<FiltrosLibro>();
  readonly cambio = output<FiltrosLibro>();
  private readonly campo = viewChild.required<ElementRef<HTMLInputElement>>('campo');

  protected emitir(parcial: Partial<FiltrosLibro>): void {
    this.cambio.emit({ ...this.filtros(), ...parcial });
  }

  /** "/" enfoca el buscador (como en GitHub o YouTube), salvo si ya estás escribiendo. */
  protected atajo(evento: KeyboardEvent): void {
    const destino = evento.target; // puede ser el propio document, que no tiene closest()
    const escribiendo =
      destino instanceof Element && destino.closest('input, textarea, select, [contenteditable]');
    if (evento.key === '/' && !escribiendo) {
      evento.preventDefault();
      this.campo().nativeElement.focus();
    }
  }
}
