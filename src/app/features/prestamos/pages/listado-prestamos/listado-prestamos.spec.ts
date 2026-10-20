import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { hastaQue, responder } from '../../../../testing/responder';
import { iniciarSesionDePrueba } from '../../../../testing/sesion';
import ListadoPrestamos from './listado-prestamos';

const prestamo = (id: number, estado = 'activo') => ({
  id,
  libro: { id, titulo: `Libro ${id}`, isbn: '9780441172719' },
  ejemplar: `E-${id}`,
  estado,
  fecha_inicio: '2026-10-01T10:00:00Z',
  fecha_limite: '2026-10-22T10:00:00Z',
  multa: null,
});
const NEXT = 'http://localhost:4200/api/v1/prestamos/?cursor=cD0yMDI2';

describe('ListadoPrestamos (TanStack Query)', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        // un QueryClient nuevo por test: sin caché compartida entre tests y sin reintentos
        provideTanStackQuery(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  async function crear() {
    const fixture = TestBed.createComponent(ListadoPrestamos);
    const el = fixture.nativeElement as HTMLElement;
    const titulos = () =>
      [...el.querySelectorAll('li')].map((li) => li.textContent?.split('·')[0].trim());
    return {
      fixture,
      el,
      titulos,
      estable: () => fixture.whenStable(),
      hasta: (c: () => boolean) => hastaQue(fixture, c),
    };
  }

  it('pagina por cursor manteniendo la página anterior mientras carga', async () => {
    const { el, titulos, hasta } = await crear();
    await responder(http, '/api/v1/prestamos/', {
      next: NEXT,
      previous: null,
      results: [prestamo(1), prestamo(2)],
    });
    await hasta(() => titulos().length === 2);
    expect(titulos()).toEqual(['Libro 1', 'Libro 2']);

    [...el.querySelectorAll('button')].find((b) => b.textContent?.includes('Siguiente'))!.click();
    await new Promise((r) => setTimeout(r));
    expect(titulos()).toEqual(['Libro 1', 'Libro 2']); // placeholderData: sin "Cargando…" en blanco
    const req = await responder(http, '/api/v1/prestamos/', {
      next: null,
      previous: 'x',
      results: [prestamo(3)],
    });
    expect(req.params.get('cursor')).toBe('cD0yMDI2');
    await hasta(() => titulos().length === 1);
    expect(titulos()).toEqual(['Libro 3']);
  });

  it('devolver invalida la lista y la vuelve a pedir', async () => {
    iniciarSesionDePrueba(['prestamos.change_prestamo'], true);
    const { el, titulos, hasta } = await crear();
    await responder(http, '/api/v1/prestamos/', {
      next: null,
      previous: null,
      results: [prestamo(1)],
    });
    await hasta(() => el.querySelector('li button') !== null);
    el.querySelector<HTMLButtonElement>('li button')!.click();
    // mutate() es asíncrono: la petición sale en el siguiente "tick"
    const post = await responder(http, '/api/v1/prestamos/1/devolver/', prestamo(1, 'devuelto'));
    expect(post.method).toBe('POST');
    await responder(http, '/api/v1/prestamos/', {
      next: null,
      previous: null,
      results: [prestamo(1, 'devuelto')],
    });
    await hasta(() => !!el.querySelector('li')?.textContent?.includes('devuelto'));
    expect(el.querySelector('li button')).toBeNull();
    expect(titulos()).toEqual(['Libro 1']);
  });

  it('cambiar el filtro es otra clave: otra petición, desde la primera página', async () => {
    const { el, hasta } = await crear();
    await responder(http, '/api/v1/prestamos/', {
      next: NEXT,
      previous: null,
      results: [prestamo(1)],
    });
    await hasta(() => el.querySelector('li') !== null);
    const select = el.querySelector('select')!;
    select.value = 'devuelto';
    select.dispatchEvent(new Event('change'));
    const req = await responder(http, '/api/v1/prestamos/', {
      next: null,
      previous: null,
      results: [],
    });
    expect(req.params.toString()).toBe('estado=devuelto');
    await hasta(() => el.querySelector('li')?.textContent?.trim() === 'No hay préstamos.');
  });
});
