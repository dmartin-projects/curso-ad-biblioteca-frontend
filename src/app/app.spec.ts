import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { NEVER } from 'rxjs';
import { Almacenamiento, AlmacenamientoMemoria } from './core/almacenamiento';
import { NotificacionesWs } from './core/notificaciones/notificaciones-ws';
import { Confirmaciones } from './shared/components/confirmar/confirmaciones';
import { TituloConSufijo } from './core/titulo';
import { authInterceptor } from './core/auth/auth.interceptor';
import { erroresInterceptor } from './core/http/errores';
import { LIBROS_DE_PRUEBA } from './features/catalogo/services/datos-prueba';
import { responder } from './testing/responder';
import { iniciarSesionDePrueba, USUARIO_DE_PRUEBA } from './testing/sesion';

const PAGINA_VACIA = {
  count: 0,
  total_pages: 1,
  page: 1,
  page_size: 12,
  next: null,
  previous: null,
  results: [],
};
const DETALLE = {
  ...LIBROS_DE_PRUEBA[0],
  autores: [{ id: 1, nombre: 'Frank', apellidos: 'Herbert', slug: 'fh' }],
};

async function app() {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes, withComponentInputBinding()),
      { provide: TitleStrategy, useClass: TituloConSufijo },
      { provide: Almacenamiento, useClass: AlmacenamientoMemoria },
      provideHttpClient(withInterceptors([erroresInterceptor, authInterceptor])), // como en app.config
      provideHttpClientTesting(),
      provideTanStackQuery(new QueryClient()),
      // sin WebSocket de verdad en los tests: un flujo que nunca emite
      { provide: NotificacionesWs, useValue: { mensajes$: NEVER } },
    ],
  });
  const harness = await RouterTestingHarness.create();
  const router = TestBed.inject(Router);
  const http = TestBed.inject(HttpTestingController);
  const el = () => harness.fixture.nativeElement as HTMLElement;
  const estable = () => harness.fixture.whenStable();
  const escribirEn = (selector: string, valor: string) => {
    const input = el().querySelector<HTMLInputElement>(selector)!;
    input.value = valor;
    input.dispatchEvent(new Event('input')); // los formularios reactivos escuchan el evento input
  };
  const rellenarLogin = () => {
    escribirEn('input[type=email]', 'ana@example.com');
    escribirEn('input[type=password]', 'clave');
  };
  const ir = async (url: string) => {
    await harness.navigateByUrl(url);
    await estable();
  };
  return { harness, router, http, el, ir, estable, rellenarLogin };
}

describe('Rutas de la biblioteca', () => {
  it('sin sesión → /login?next=…; al entrar vuelve a next', async () => {
    const { router, http, el, ir, estable, rellenarLogin } = await app();
    await ir('/prestamos');
    expect(router.url).toBe('/login?next=%2Fprestamos');
    expect(TestBed.inject(Title).getTitle()).toBe('Iniciar sesión · Biblioteca');

    // con los campos vacíos, el formulario no se envía: marca el error y lleva ahí el foco
    el().querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await estable();
    http.expectNone('/api/v1/auth/login/');
    const email = el().querySelector<HTMLInputElement>('input[type=email]')!;
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(email.getAttribute('aria-describedby')!)?.textContent).toContain(
      'Obligatorio',
    );
    expect(document.activeElement).toBe(email);

    rellenarLogin();
    el().querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    const login = http.expectOne('/api/v1/auth/login/');
    expect(login.request.body).toEqual({ email: 'ana@example.com', password: 'clave' });
    login.flush({ access: 'nuevo' });
    await responder(http, '/api/v1/auth/me/', USUARIO_DE_PRUEBA);
    await estable();
    expect(router.url).toBe('/prestamos');
    expect(TestBed.inject(Title).getTitle()).toBe('Mis préstamos · Biblioteca');
    expect(el().querySelector('mat-nav-list')?.textContent).toContain('Catálogo');
  });

  it('credenciales malas: mensaje genérico y se queda en el login', async () => {
    const { router, http, el, ir, estable, rellenarLogin } = await app();
    await ir('/login');
    rellenarLogin();
    el().querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    http
      .expectOne('/api/v1/auth/login/')
      .flush(
        { type: 'no_autenticado', title: 'Debes iniciar sesión.' },
        { status: 401, statusText: 'Unauthorized' },
      );
    await estable();
    expect(el().querySelector('[role=alert]')?.textContent).toBe('Email o contraseña incorrectos.');
    expect(router.url).toBe('/login');
  });

  it('next con una URL externa se ignora', async () => {
    const { router, http, el, ir, estable, rellenarLogin } = await app();
    await ir('/login?next=https://malo.example');
    rellenarLogin();
    el().querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    http.expectOne('/api/v1/auth/login/').flush({ access: 'nuevo' });
    await responder(http, '/api/v1/auth/me/', USUARIO_DE_PRUEBA);
    await responder(http, '/api/v1/libros/', PAGINA_VACIA); // aterriza en el catálogo
    await responder(http, '/api/v1/generos/', []);
    await estable();
    expect(router.url).toBe('/catalogo');
  });

  it('admin: canMatch deja pasar al personal; al lector le sale el 404', async () => {
    const { router, el, ir, http } = await app();
    iniciarSesionDePrueba([], false);
    await ir('/admin');
    expect(router.url).toBe('/admin'); // la URL se queda, pero coincide con **
    expect(el().textContent).toContain('Página no encontrada');
    expect(el().querySelector('a[href="/admin"]')).toBeNull();

    iniciarSesionDePrueba([], true);
    await ir('/admin'); // ⚠️ misma URL que la actual: el router la IGNORA (onSameUrlNavigation)
    expect(el().textContent).toContain('Página no encontrada');
    await ir('/prestamos');
    // la página de admin pide los géneros: hay que responder mientras se navega
    await Promise.all([ir('/admin'), responder(http, '/api/v1/generos/', [])]);
    expect(el().querySelector('h1')?.textContent).toBe('Administración');
  });

  it('URL desconocida → página 404 con título', async () => {
    const { el, ir } = await app();
    await ir('/no-existe');
    expect(el().textContent).toContain('Página no encontrada');
    expect(TestBed.inject(Title).getTitle()).toBe('No encontrado · Biblioteca');
  });

  it('título dinámico con el resolver del libro', async () => {
    const { harness, http } = await app();
    iniciarSesionDePrueba();
    const navegacion = harness.navigateByUrl('/catalogo/libros/1');
    await responder(http, '/api/v1/libros/1/', { id: 1, titulo: 'Dune' }); // el resolver
    await responder(http, '/api/v1/libros/1/', DETALLE); // el recurso de la página
    await navegacion;
    expect(TestBed.inject(Title).getTitle()).toBe('Dune · Biblioteca');
  });

  it('canDeactivate: con cambios pregunta; si dices que no, te quedas', async () => {
    const { router, el, ir, estable } = await app();
    iniciarSesionDePrueba(['catalogo.add_libro'], true);
    await ir('/catalogo/nuevo');
    const titulo = el().querySelector<HTMLInputElement>('[name="libro.titulo"]')!;
    titulo.value = 'Dune';
    titulo.dispatchEvent(new Event('input', { bubbles: true }));
    await estable();

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
