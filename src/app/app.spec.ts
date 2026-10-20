import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { LIBROS_DE_PRUEBA } from './features/catalogo/services/datos-prueba';

const LIBRO = LIBROS_DE_PRUEBA[0];
import { Almacenamiento, AlmacenamientoMemoria } from './core/almacenamiento';
import { AuthStore } from './core/auth/auth-store';
import { Confirmaciones } from './shared/components/confirmar/confirmaciones';
import { responder } from './testing/responder';
import { TituloConSufijo } from './core/titulo';

async function app() {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes, withComponentInputBinding()),
      { provide: TitleStrategy, useClass: TituloConSufijo },
      { provide: Almacenamiento, useClass: AlmacenamientoMemoria },
      provideHttpClientTesting(),
    ],
  });
  const harness = await RouterTestingHarness.create();
  const router = TestBed.inject(Router);
  const el = () => harness.fixture.nativeElement as HTMLElement;
  const ir = async (url: string) => {
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
  };
  return { harness, router, el, ir };
}

describe('Rutas de la biblioteca', () => {
  it('sin sesión → /login?next=…; al entrar vuelve a next', async () => {
    const { router, el, ir, harness } = await app();
    await ir('/prestamos');
    expect(router.url).toBe('/login?next=%2Fprestamos');
    expect(TestBed.inject(Title).getTitle()).toBe('Iniciar sesión · Biblioteca');

    el().querySelector<HTMLButtonElement>('#lector')!.click();
    await harness.fixture.whenStable();
    await new Promise((r) => setTimeout(r)); // la navegación de vuelta es asíncrona
    await harness.fixture.whenStable();
    expect(router.url).toBe('/prestamos');
    expect(TestBed.inject(Title).getTitle()).toBe('Mis préstamos · Biblioteca');
    expect(el().querySelector('header nav')?.textContent).toContain('Catálogo');
  });

  it('next con una URL externa se ignora', async () => {
    const { router, el, ir, harness } = await app();
    await ir('/login?next=https://malo.example');
    el().querySelector<HTMLButtonElement>('#lector')!.click();
    await new Promise((r) => setTimeout(r));
    await harness.fixture.whenStable();
    expect(router.url).toBe('/catalogo');
  });

  it('admin: canMatch deja pasar al bibliotecario; al lector le sale el 404', async () => {
    const { router, el, ir } = await app();
    TestBed.inject(AuthStore).iniciarSesion([], []);
    await ir('/admin');
    expect(router.url).toBe('/admin'); // la URL se queda, pero coincide con **
    expect(el().textContent).toContain('Página no encontrada');
    expect(el().querySelector('a[href="/admin"]')).toBeNull();

    TestBed.inject(AuthStore).iniciarSesion([], ['bibliotecario']);
    await ir('/admin'); // ⚠️ misma URL que la actual: el router la IGNORA (onSameUrlNavigation)
    expect(el().textContent).toContain('Página no encontrada');
    await ir('/prestamos');
    await ir('/admin');
    expect(el().querySelector('h1')?.textContent).toBe('Administración');
  });

  it('URL desconocida → página 404 con título', async () => {
    const { el, ir } = await app();
    await ir('/no-existe');
    expect(el().textContent).toContain('Página no encontrada');
    expect(TestBed.inject(Title).getTitle()).toBe('No encontrado · Biblioteca');
  });

  it('título dinámico con el resolver del libro', async () => {
    const { harness } = await app();
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthStore).iniciarSesion([], []);
    const navegacion = harness.navigateByUrl('/catalogo/libros/1');
    await responder(http, '/api/v1/libros/1/', { id: 1, titulo: 'Dune' }); // el resolver
    await responder(http, '/api/v1/libros/1/', { ...LIBRO, id: 1 }); // el httpResource de la página
    await navegacion;
    expect(TestBed.inject(Title).getTitle()).toBe('Dune · Biblioteca');
  });

  it('canDeactivate: con cambios pregunta; si dices que no, te quedas', async () => {
    const { router, el, ir, harness } = await app();
    TestBed.inject(AuthStore).iniciarSesion(['catalogo.add_libro'], ['bibliotecario']);
    await ir('/catalogo/nuevo');
    const titulo = el().querySelector<HTMLInputElement>('input[name=titulo]')!;
    titulo.value = 'Dune';
    titulo.dispatchEvent(new Event('input', { bubbles: true }));
    await harness.fixture.whenStable();

    const preguntar = vi
      .spyOn(TestBed.inject(Confirmaciones), 'preguntar')
      .mockResolvedValue(false);
    await ir('/prestamos');
    expect(preguntar).toHaveBeenCalledOnce();
    expect(router.url).toBe('/catalogo/nuevo');

    preguntar.mockResolvedValue(true);
    await ir('/prestamos');
    expect(router.url).toBe('/prestamos');
  });
});
