import { Component, inject, input, output } from '@angular/core';
import { DetalleLibro } from '../../components/detalle-libro/detalle-libro';
import { CatalogoApi } from '../../services/catalogo-api';

/** Contenedor: pide el libro a CatalogoApi (un resource); DetalleLibro solo pinta. */
@Component({
  selector: 'app-pagina-detalle-libro',
  imports: [DetalleLibro],
  templateUrl: './pagina-detalle-libro.html',
})
export class PaginaDetalleLibro {
  readonly id = input.required<number>();
  readonly reservar = output<number>();

  protected readonly libro = inject(CatalogoApi).libroResource(this.id);
}
