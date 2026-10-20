import { TestBed } from '@angular/core/testing';
import { CarritoReservas } from '../../../../core/carrito/carrito-reservas';
import { CatalogoPage } from './catalogo-page';

async function crear() {
  const fixture = TestBed.createComponent(CatalogoPage);
  await fixture.whenStable();
  return { fixture, cmp: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
}

function escribir(el: HTMLElement, texto: string) {
  const campo = el.querySelector<HTMLInputElement>('input[type=search]')!;
  campo.value = texto;
  campo.dispatchEvent(new Event('input'));
}

describe('CatalogoPage', () => {
  beforeEach(() => localStorage.clear());

  it('pinta una tarjeta por libro y el contador con @let', async () => {
    const { el } = await crear();
    expect(el.querySelectorAll('app-libro-card').length).toBe(3);
    expect(el.querySelector('.contador')?.textContent).toContain('3 libros · 3 ejemplares');
  });

  it('filtra por título o autor, sin acentos, y recalcula el total', async () => {
    const { fixture, cmp, el } = await crear();
    escribir(el, 'garcia');
    await fixture.whenStable();
    expect(cmp.total()).toBe(1);
    expect(el.querySelector('app-libro-card h3')?.textContent).toBe('Cien años de soledad');

    escribir(el, 'zzz');
    await fixture.whenStable();
    expect(el.textContent).toContain('No hay libros que coincidan.');
  });

  it('guarda el filtro con un effect y lo recupera al iniciar', async () => {
    const primero = await crear();
    escribir(primero.el, 'dune');
    await primero.fixture.whenStable(); // los effects se ejecutan en la detección de cambios
    expect(localStorage.getItem('catalogo.filtro')).toBe('dune');

    const segundo = await crear();
    expect(segundo.cmp.filtro()).toBe('dune');
    expect(segundo.cmp.total()).toBe(2);
  });

  it('"/" enfoca el buscador, salvo si ya estás escribiendo', async () => {
    const { el } = await crear();
    const campo = el.querySelector<HTMLInputElement>('input[type=search]')!;
    const evento = new KeyboardEvent('keydown', { key: '/', cancelable: true });
    document.dispatchEvent(evento);
    expect(document.activeElement).toBe(campo);
    expect(evento.defaultPrevented).toBe(true);

    const dentro = new KeyboardEvent('keydown', { key: '/', cancelable: true, bubbles: true });
    campo.dispatchEvent(dentro); // escribiendo en el propio campo: la "/" se escribe
    expect(dentro.defaultPrevented).toBe(false);
  });

  it('reservar añade al carrito compartido', async () => {
    const { el } = await crear();
    el.querySelector<HTMLButtonElement>('app-libro-card button')!.click();
    expect(
      TestBed.inject(CarritoReservas)
        .lineas()
        .map((l) => l.libro.titulo),
    ).toEqual(['Dune']);
  });
});
