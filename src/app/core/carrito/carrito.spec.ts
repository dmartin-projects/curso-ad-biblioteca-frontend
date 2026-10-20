import { TestBed } from '@angular/core/testing';
import { CarritoReservas, LibroReservable } from './carrito-reservas';
import { ResumenCarrito } from './resumen-carrito/resumen-carrito';

const DUNE: LibroReservable = { id: 1, titulo: 'Dune', ejemplares_disponibles: 2 };

describe('CarritoReservas', () => {
  it('no duplica, cambia cantidades sin mutar y quita', () => {
    const carrito = TestBed.inject(CarritoReservas);
    carrito.anadir(DUNE);
    carrito.anadir(DUNE);
    expect(carrito.total()).toBe(1);
    const antes = carrito.lineas();
    carrito.cambiarCantidad(1, 2);
    expect(carrito.lineas()).not.toBe(antes); // array nuevo: por eso notifica
    expect(carrito.total()).toBe(2);
    carrito.quitar(1);
    expect(carrito.lineas()).toEqual([]);
  });

  it('dos componentes ven el mismo estado (un único servicio en la app)', async () => {
    const carrito = TestBed.inject(CarritoReservas);
    const fixture = TestBed.createComponent(ResumenCarrito);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Aún no has reservado nada.');

    carrito.anadir(DUNE); // como si lo hiciera CatalogoPage
    await fixture.whenStable();
    expect(el.querySelector('h2')?.textContent).toBe('Reservas (1)');

    el.querySelector<HTMLButtonElement>('button[aria-label="Más"]')!.click();
    await fixture.whenStable();
    expect(carrito.total()).toBe(2);
    expect(el.querySelector<HTMLButtonElement>('button[aria-label="Más"]')!.disabled).toBe(true);
  });
});
