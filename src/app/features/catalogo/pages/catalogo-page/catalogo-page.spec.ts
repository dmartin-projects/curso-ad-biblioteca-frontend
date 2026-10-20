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

const titulos = (el: HTMLElement) =>
  Array.from(el.querySelectorAll('app-libro-card h3')).map((h) => h.textContent);

describe('CatalogoPage (contenedor)', () => {
  beforeEach(() => localStorage.clear());

  it('pagina de 2 en 2 y vuelve a la página 1 al filtrar (linkedSignal)', async () => {
    const { fixture, cmp, el } = await crear();
    expect(titulos(el)).toEqual(['Dune', 'Cien años de soledad']);
    el.querySelectorAll<HTMLButtonElement>('app-paginador button')[1].click(); // Siguiente
    await fixture.whenStable();
    expect(cmp.pagina()).toBe(2);
    expect(titulos(el)).toEqual(['Hijos de Dune', 'La mano izquierda de la oscuridad']);

    escribir(el, 'dune');
    await fixture.whenStable();
    expect(cmp.pagina()).toBe(1);
    expect(cmp.total()).toBe(2);
  });

  it('el check "solo disponibles" quita los agotados', async () => {
    const { fixture, cmp, el } = await crear();
    const check = el.querySelector<HTMLInputElement>('input[type=checkbox]')!;
    check.checked = true;
    check.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(cmp.total()).toBe(4);
  });

  it('guarda los filtros y los recupera', async () => {
    const primero = await crear();
    escribir(primero.el, 'garcia');
    await primero.fixture.whenStable();
    const segundo = await crear();
    expect(segundo.cmp.filtros().texto).toBe('garcia');
    expect(segundo.cmp.total()).toBe(1);
  });

  it('vista compacta con Lista<T> y plantilla de fila', async () => {
    const { fixture, el } = await crear();
    Array.from(el.querySelectorAll('button'))
      .find((b) => b.textContent?.includes('Vista compacta'))!
      .click();
    await fixture.whenStable();
    const filas = Array.from(el.querySelectorAll('app-lista li')).map((li) =>
      li.textContent?.trim(),
    );
    expect(filas).toEqual([
      '1. Dune — Frank Herbert',
      '2. Cien años de soledad — Gabriel García Márquez',
    ]);
  });

  it('la reserva de la lista llega al carrito', async () => {
    const { el } = await crear();
    el.querySelector<HTMLButtonElement>('app-libro-card button')!.click();
    expect(TestBed.inject(CarritoReservas).total()).toBe(1);
  });
});
