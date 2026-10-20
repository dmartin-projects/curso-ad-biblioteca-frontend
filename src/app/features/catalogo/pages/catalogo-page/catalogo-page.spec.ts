import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CarritoReservas } from '../../../../core/carrito/carrito-reservas';
import { provideCatalogo } from '../../catalogo.config';
import CatalogoPage from './catalogo-page';

async function abrir(url = '/catalogo') {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'catalogo', component: CatalogoPage }], withComponentInputBinding()),
      provideCatalogo({ tamanoPagina: 2 }),
    ],
  });
  const harness = await RouterTestingHarness.create();
  const cmp = await harness.navigateByUrl(url, CatalogoPage);
  const el = harness.routeNativeElement!;
  const router = TestBed.inject(Router);
  const estable = () => harness.fixture.whenStable();
  return { harness, cmp, el, router, estable };
}

function escribir(el: HTMLElement, texto: string) {
  const campo = el.querySelector<HTMLInputElement>('input[type=search]')!;
  campo.value = texto;
  campo.dispatchEvent(new Event('input'));
}

const titulos = (el: HTMLElement) =>
  Array.from(el.querySelectorAll('app-libro-card h3')).map((h) => h.textContent?.trim());

describe('CatalogoPage (filtros y página en la URL)', () => {
  it('pagina de 2 en 2 con ?page y vuelve a la 1 al filtrar', async () => {
    const { el, router, estable, cmp } = await abrir();
    expect(titulos(el)).toEqual(['Dune', 'Cien años de soledad']);

    el.querySelectorAll<HTMLButtonElement>('app-paginador button')[1].click(); // Siguiente
    await estable();
    expect(router.url).toBe('/catalogo?page=2');
    expect(titulos(el)).toEqual(['Hijos de Dune', 'La mano izquierda de la oscuridad']);

    escribir(el, 'dune');
    await estable();
    expect(router.url).toBe('/catalogo?search=dune'); // page desaparece: vuelve a la 1
    expect(cmp.page()).toBe(1);
    expect(cmp.total()).toBe(2);
  });

  it('la URL manda: abrir un enlace compartido restaura filtros y página', async () => {
    const { el, cmp } = await abrir('/catalogo?search=a&disponibles=true&page=2');
    expect(cmp.filtros()).toEqual({ texto: 'a', soloDisponibles: true });
    expect(cmp.page()).toBe(2);
    expect(el.querySelector<HTMLInputElement>('input[type=search]')!.value).toBe('a');
    expect(el.querySelector<HTMLInputElement>('input[type=checkbox]')!.checked).toBe(true);
  });

  it('sin query params, los valores por defecto (no undefined ni NaN)', async () => {
    const { harness, cmp } = await abrir('/catalogo?search=x&page=3');
    await harness.navigateByUrl('/catalogo');
    expect(cmp.search()).toBe('');
    expect(cmp.page()).toBe(1);
    expect(cmp.disponibles()).toBe(false);
    await harness.navigateByUrl('/catalogo?disponibles=0'); // solo "true" activa el filtro
    expect(cmp.disponibles()).toBe(false);
  });

  it('el check "solo disponibles" va a la URL y quita los agotados', async () => {
    const { el, router, estable, cmp } = await abrir();
    const check = el.querySelector<HTMLInputElement>('input[type=checkbox]')!;
    check.checked = true;
    check.dispatchEvent(new Event('change'));
    await estable();
    expect(router.url).toBe('/catalogo?disponibles=true');
    expect(cmp.total()).toBe(4);
  });

  it('vista compacta con Lista<T> y plantilla de fila', async () => {
    const { el, estable } = await abrir();
    Array.from(el.querySelectorAll('button'))
      .find((b) => b.textContent?.includes('Vista compacta'))!
      .click();
    await estable();
    const filas = Array.from(el.querySelectorAll('app-lista li')).map((li) =>
      li.textContent?.trim(),
    );
    expect(filas).toEqual([
      '1. Dune — Frank Herbert',
      '2. Cien años de soledad — Gabriel García Márquez',
    ]);
  });

  it('la reserva de la lista llega al carrito', async () => {
    const { el } = await abrir();
    el.querySelector<HTMLButtonElement>('app-libro-card button')!.click();
    expect(TestBed.inject(CarritoReservas).total()).toBe(1);
  });

  it('cada tarjeta enlaza a su detalle', async () => {
    const { el } = await abrir();
    expect(el.querySelector('app-libro-card h3 a')?.getAttribute('href')).toBe(
      '/catalogo/libros/1',
    );
  });

  it('exporta a CSV cargando el exportador bajo demanda (injectAsync)', async () => {
    const { cmp } = await abrir();
    let blob: Blob | undefined;
    URL.createObjectURL = (b: Blob) => ((blob = b), 'blob:x'); // jsdom no lo implementa
    URL.revokeObjectURL = () => undefined;
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await cmp.exportar();
    const texto = await blob!.text();
    expect(texto).toContain('id;titulo;autores;disponibles');
    expect(texto).toContain('"Dune";"Frank Herbert"');
    expect(click).toHaveBeenCalledOnce();
    click.mockRestore();
  });
});
