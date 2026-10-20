import { Component, inject } from '@angular/core';
import { SelectorCantidad } from '../../../shared/components/selector-cantidad/selector-cantidad';
import { CarritoReservas } from '../carrito-reservas';

@Component({
  selector: 'app-resumen-carrito',
  imports: [SelectorCantidad],
  templateUrl: './resumen-carrito.html',
})
export class ResumenCarrito {
  protected readonly carrito = inject(CarritoReservas);
}
