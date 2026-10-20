import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { responder } from '../../../../testing/responder';
import { iniciarSesionDePrueba } from '../../../../testing/sesion';
import { LibroDetalle } from '../../interfaces/catalogo.models';
import PaginaDetalleLibro from './pagina-detalle-libro';

const detalle = (id: number, titulo: string): LibroDetalle => ({
  id,
  titulo,
  isbn: '9780441172719',
  publicado: '1965-08-01',
  autores: [{ id: 1, nombre: 'Frank', apellidos: 'Herbert', slug: 'frank-herbert' }],
});

describe('PaginaDetalleLibro (id como input + CatalogoApi.libroResource)', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;
  const h1 = () => harness.routeNativeElement?.querySelector('h1')?.textContent?.trim();

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [{ path: 'catalogo/libros/:id', component: PaginaDetalleLibro }],
          withComponentInputBinding(),
        ),
        provideHttpClientTesting(), // HttpClient ya está provisto por defecto en Angular 22
      ],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  it('navegar de un libro a otro reutiliza el componente y recarga', async () => {
    // no se puede hacer await de la navegación antes de responder: el recurso la mantiene "inestable"
    const navegacion = harness.navigateByUrl('/catalogo/libros/1', PaginaDetalleLibro);
    await responder(http, '/api/v1/libros/1/', detalle(1, 'Dune'));
    const primero = await navegacion;
    await harness.fixture.whenStable();
    expect(h1()).toBe('Dune');
    expect(harness.routeNativeElement?.querySelector('.autores')?.textContent).toBe(
      'Frank Herbert',
    );

    harness
      .routeNativeElement!.querySelector<HTMLAnchorElement>('a[href="/catalogo/libros/2"]')!
      .click();
    await responder(http, '/api/v1/libros/2/', detalle(2, 'Hijos de Dune'));
    await harness.fixture.whenStable();
    expect(harness.routeDebugElement?.componentInstance).toBe(primero); // MISMA instancia
    expect(h1()).toBe('Hijos de Dune');
  });

  it('error → reintentar', async () => {
    const navegacion = harness.navigateByUrl('/catalogo/libros/99');
    await responder(http, '/api/v1/libros/99/', 'no', { status: 404, statusText: 'Not Found' });
    await navegacion;
    await harness.fixture.whenStable();
    const el = harness.routeNativeElement!;
    expect(el.querySelector('[role=alert]')).not.toBeNull();

    el.querySelector<HTMLButtonElement>('[role=alert] button')!.click();
    await responder(http, '/api/v1/libros/99/', detalle(99, 'Dune'));
    await harness.fixture.whenStable();
    expect(h1()).toBe('Dune');
  });

  it('solo quien puede editar ve la subida de portada', async () => {
    const navegacion = harness.navigateByUrl('/catalogo/libros/1');
    await responder(http, '/api/v1/libros/1/', detalle(1, 'Dune'));
    await navegacion;
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.querySelector('app-subir-portada')).toBeNull();
    iniciarSesionDePrueba(['catalogo.change_libro'], true);
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.querySelector('app-subir-portada')).not.toBeNull();
  });

  it('SWR: al volver a un libro ya visto aparece AL INSTANTE y luego se refresca', async () => {
    let navegacion = harness.navigateByUrl('/catalogo/libros/1', PaginaDetalleLibro);
    await responder(http, '/api/v1/libros/1/', detalle(1, 'Dune'));
    await navegacion;
    navegacion = harness.navigateByUrl('/catalogo/libros/2', PaginaDetalleLibro);
    await responder(http, '/api/v1/libros/2/', detalle(2, 'Hijos de Dune'));
    await navegacion;
    await harness.fixture.whenStable();

    harness.navigateByUrl('/catalogo/libros/1');
    await new Promise((r) => setTimeout(r));
    harness.fixture.detectChanges();
    expect(h1()).toBe('Dune'); // lo cacheado, sin esperar a la red
    await responder(http, '/api/v1/libros/1/', detalle(1, 'Dune (edición revisada)'));
    await harness.fixture.whenStable();
    expect(h1()).toBe('Dune (edición revisada)'); // y se corrige solo
  });
});
