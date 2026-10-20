import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { responder } from '../../../../testing/responder';
import { LIBROS_DE_PRUEBA } from '../../services/datos-prueba';
import PaginaDetalleLibro from './pagina-detalle-libro';

describe('PaginaDetalleLibro (id como input + httpResource)', () => {
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
    await responder(http, '/api/v1/libros/1/', LIBROS_DE_PRUEBA[0]);
    const primero = await navegacion;
    await harness.fixture.whenStable();
    expect(h1()).toBe('Dune');

    harness
      .routeNativeElement!.querySelector<HTMLAnchorElement>('a[href="/catalogo/libros/2"]')!
      .click();
    await responder(http, '/api/v1/libros/2/', LIBROS_DE_PRUEBA[1]);
    await harness.fixture.whenStable();
    expect(harness.routeDebugElement?.componentInstance).toBe(primero); // MISMA instancia
    expect(h1()).toBe('Cien años de soledad');
  });

  it('error → reintentar', async () => {
    const navegacion = harness.navigateByUrl('/catalogo/libros/99');
    await responder(http, '/api/v1/libros/99/', 'no', { status: 404, statusText: 'Not Found' });
    await navegacion;
    await harness.fixture.whenStable();
    const el = harness.routeNativeElement!;
    expect(el.querySelector('[role=alert]')).not.toBeNull();

    el.querySelector<HTMLButtonElement>('[role=alert] button')!.click();
    await responder(http, '/api/v1/libros/99/', LIBROS_DE_PRUEBA[2]);
    await harness.fixture.whenStable();
    expect(h1()).toBe('Hijos de Dune');
  });
});
