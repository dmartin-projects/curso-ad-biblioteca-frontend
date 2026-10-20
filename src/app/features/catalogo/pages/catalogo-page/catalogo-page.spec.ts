import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Paginado } from '../../../../core/api/tipos';
import { responder } from '../../../../testing/responder';
import { CarritoReservas } from '../../../../core/carrito/carrito-reservas';
import { provideCatalogo } from '../../catalogo.config';
import { Libro } from '../../interfaces/catalogo.models';
import { LIBROS_DE_PRUEBA } from '../../services/datos-prueba';
import CatalogoPage from './catalogo-page';

/** Simula la respuesta paginada de la API con los datos de prueba. */
function pagina(libros: Libro[], page = 1, total = libros.length): Paginado<Libro> {
  return {
    count: total,
    total_pages: Math.ceil(total / 2),
    page,
    page_size: 2,
    next: null,
    previous: null,
    results: libros,
  };
}

async function abrir(
  url = '/catalogo',
  respuesta: unknown = pagina(LIBROS_DE_PRUEBA.slice(0, 2), 1, 5),
  error?: { status: number; statusText: string },
) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'catalogo', component: CatalogoPage }], withComponentInputBinding()),
      provideCatalogo({ tamanoPagina: 2 }),
      provideHttpClientTesting(),
    ],
  });
  const http = TestBed.inject(HttpTestingController);
  const harness = await RouterTestingHarness.create();
  const navegacion = harness.navigateByUrl(url, CatalogoPage);
  const [peticion] = await Promise.all([
    responder(http, '/api/v1/libros/', respuesta, error),
    responder(http, '/api/v1/generos/', [{ id: 3, nombre: 'Ciencia ficción' }]),
  ]);
  const cmp = await navegacion;
  await harness.fixture.whenStable();
  const el = harness.routeNativeElement!;
  const router = TestBed.inject(Router);
  return { harness, cmp, el, router, http, peticion };
}

function escribir(el: HTMLElement, texto: string) {
  const campo = el.querySelector<HTMLInputElement>('input[type=search]')!;
  campo.value = texto;
  campo.dispatchEvent(new Event('input'));
}

const titulos = (el: HTMLElement) =>
  Array.from(el.querySelectorAll('app-libro-card h3')).map((h) => h.textContent?.trim());

describe('CatalogoPage (URL → consulta → API)', () => {
  it('pide la página 1 de 2 en 2 y pinta lo que devuelve la API', async () => {
    const { el, peticion } = await abrir();
    expect(peticion.params.toString()).toBe('page=1&page_size=2'); // sin search= ni disponible=
    expect(titulos(el)).toEqual(['Dune', 'Cien años de soledad']);
    expect(el.querySelector('.contador')?.textContent?.trim()).toBe('5 libros');
  });

  it('anuncia el número de resultados al filtrar, no al llegar (módulo 59)', async () => {
    const anunciar = vi.spyOn(LiveAnnouncer.prototype, 'announce').mockResolvedValue();
    const { el, http, harness } = await abrir();
    expect(anunciar).not.toHaveBeenCalled(); // al llegar, el lector ya está leyendo la página
    escribir(el, 'dune');
    await harness.fixture.whenStable();
    await responder(http, '/api/v1/libros/', pagina([LIBROS_DE_PRUEBA[0], LIBROS_DE_PRUEBA[2]]));
    await harness.fixture.whenStable();
    expect(anunciar).toHaveBeenCalledWith('2 libros encontrados', 'polite');
  });

  it('Siguiente → ?page=2 → nueva petición; filtrar vuelve a la 1', async () => {
    const { el, router, http, harness } = await abrir();
    el.querySelectorAll<HTMLButtonElement>('app-paginador button')[1].click();
    const p2 = await responder(http, '/api/v1/libros/', pagina(LIBROS_DE_PRUEBA.slice(2, 4), 2, 5));
    await harness.fixture.whenStable();
    expect(router.url).toBe('/catalogo?page=2');
    expect(p2.params.get('page')).toBe('2');
    expect(titulos(el)).toEqual(['Hijos de Dune', 'La mano izquierda de la oscuridad']);

    // cuatro teclas: la URL cambia con cada una; la petición sale una vez, al dejar de escribir
    for (const texto of ['d', 'du', 'dun', 'dune']) escribir(el, texto);
    await harness.fixture.whenStable();
    expect(router.url).toBe('/catalogo?search=dune');
    expect(http.match((r) => r.url === '/api/v1/libros/')).toEqual([]); // aún nada
    const p3 = await responder(
      http,
      '/api/v1/libros/',
      pagina([LIBROS_DE_PRUEBA[0], LIBROS_DE_PRUEBA[2]]),
    );
    await harness.fixture.whenStable();
    expect(router.url).toBe('/catalogo?search=dune');
    expect(p3.params.toString()).toBe('search=dune&page=1&page_size=2');
    expect(el.querySelector('.contador')?.textContent?.trim()).toBe('2 libros');
  });

  it('un enlace compartido restaura filtros, página y consulta', async () => {
    const { cmp, el, peticion } = await abrir('/catalogo?search=a&disponibles=true&page=2');
    expect(peticion.params.toString()).toBe('search=a&disponible=true&page=2&page_size=2');
    expect(cmp.filtros()).toEqual({ texto: 'a', soloDisponibles: true });
    expect(el.querySelector<HTMLInputElement>('input[type=checkbox]')!.checked).toBe(true);
  });

  it('?disponibles= con otro valor que "true" no filtra', async () => {
    const { peticion } = await abrir('/catalogo?disponibles=0');
    expect(peticion.params.has('disponible')).toBe(false);
  });

  it('si la API falla: aviso y reintentar', async () => {
    const error = { status: 503, statusText: 'Service Unavailable' };
    const { el, http, harness } = await abrir(
      '/catalogo',
      { title: 'Mantenimiento' } as never,
      error,
    );
    expect(el.querySelector('[role=alert]')?.textContent).toContain(
      'No se pudo cargar el catálogo',
    );
    el.querySelector<HTMLButtonElement>('[role=alert] button')!.click();
    await responder(http, '/api/v1/libros/', pagina(LIBROS_DE_PRUEBA.slice(0, 2), 1, 5));
    await harness.fixture.whenStable();
    expect(el.querySelector('[role=alert]')).toBeNull();
    expect(titulos(el)).toEqual(['Dune', 'Cien años de soledad']);
  });

  it('vista compacta con Lista<T> y plantilla de fila', async () => {
    const { el, harness } = await abrir();
    Array.from(el.querySelectorAll('button'))
      .find((b) => b.textContent?.includes('Vista compacta'))!
      .click();
    await harness.fixture.whenStable();
    const filas = Array.from(el.querySelectorAll('app-lista li')).map((li) =>
      li.textContent?.trim(),
    );
    expect(filas).toEqual([
      '1. Dune — Frank Herbert',
      '2. Cien años de soledad — Gabriel García Márquez',
    ]);
  });

  it('la reserva llega al carrito y cada tarjeta enlaza a su detalle', async () => {
    const { el } = await abrir();
    expect(el.querySelector('app-libro-card h3 a')?.getAttribute('href')).toBe(
      '/catalogo/libros/1',
    );
    el.querySelector<HTMLButtonElement>('app-libro-card button')!.click();
    expect(TestBed.inject(CarritoReservas).total()).toBe(1);
  });

  it('exporta a CSV la página visible (injectAsync)', async () => {
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
