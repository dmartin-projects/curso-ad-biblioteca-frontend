import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarritoReservas } from '../../../../core/carrito/carrito-reservas';
import { DetalleLibro } from '../../components/detalle-libro/detalle-libro';
import { CatalogoApi } from '../../services/catalogo-api';

/** /catalogo/libros/:id → el id llega como input (string) y el recurso recarga al cambiar. */
@Component({
  selector: 'app-pagina-detalle-libro',
  imports: [DetalleLibro, RouterLink],
  templateUrl: './pagina-detalle-libro.html',
})
export default class PaginaDetalleLibro {
  private readonly carrito = inject(CarritoReservas);
  readonly id = input.required<string>(); // los parámetros de ruta siempre son string
  protected readonly idNumerico = computed(() => Number(this.id()));

  protected readonly libro = inject(CatalogoApi).libroResource(this.idNumerico);

  protected reservar(): void {
    if (this.libro.hasValue()) this.carrito.anadir(this.libro.value());
  }
}
