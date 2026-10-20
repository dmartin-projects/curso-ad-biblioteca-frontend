import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom, NEVER, of, TimeoutError } from 'rxjs';
import { aParams, CatalogoApi } from '../../features/catalogo/services/catalogo-api';
import { USUARIO_DE_PRUEBA } from '../../testing/sesion';
import { AuthStore } from '../auth/auth-store';
import { authInterceptor } from '../auth/auth.interceptor';
import { conCerrojo } from '../auth/cerrojo';
import { Avisos } from '../avisos/avisos';
import { APP_CONFIG } from '../config';
import { provideLocaleEs } from '../locale';
import { cabecerasInterceptor } from './cabeceras';
import { SIN_AUTH, SIN_AVISO_ERROR } from './contexto';
import { ErrorApi, erroresInterceptor } from './errores';
import { reintentosInterceptor } from './reintentos';

function configurar() {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(
        withInterceptors([
          cabecerasInterceptor,
          erroresInterceptor,
          reintentosInterceptor,
          authInterceptor,
        ]),
      ),
      provideHttpClientTesting(),
      provideRouter([]),
      ...provideLocaleEs(),
      { provide: APP_CONFIG, useValue: { apiUrl: '/api/v1', wsUrl: '', paginaPorDefecto: 20 } },
    ],
  });
  return {
    http: TestBed.inject(HttpClient),
    ctrl: TestBed.inject(HttpTestingController),
    auth: TestBed.inject(AuthStore),
  };
}

/** Otra pestaña del mismo navegador: su propio AuthStore, el mismo "servidor" (HttpTestingController). */
function otraPestana() {
  const injector = createEnvironmentInjector([AuthStore], TestBed.inject(EnvironmentInjector));
  return { auth: injector.get(AuthStore), cerrar: () => injector.destroy() };
}

const unTurno = () => new Promise((r) => setTimeout(r, 10));

/** Web Locks falsa: cada request espera a que termine la anterior (como el navegador). */
function locksEnFila() {
  let cola: Promise<unknown> = Promise.resolve();
  const request = vi.fn((_nombre: string, fn: () => Promise<unknown>) => {
    const turno = cola.then(fn);
    cola = turno.catch(() => undefined);
    return turno;
  });
  Object.defineProperty(navigator, 'locks', { value: { request }, configurable: true });
  return request;
}

describe('aParams', () => {
  it('módulo 62: conserva el 0 y los números; quita false, null, undefined y ""', () => {
    const p = aParams({
      page: 0,
      min: 5,
      search: '',
      disponible: false,
      a: null,
      b: undefined,
      x: true,
    });
    expect(p.toString()).toBe('page=0&min=5&x=true');
  });
  it('quita vacíos y repite los arrays', () => {
    const p = aParams({ search: '', page: 2, genero: [1, 3], disponible: false, orden: undefined });
    expect(p.toString()).toBe('page=2&genero=1&genero=3');
  });
});

describe('CatalogoApi', () => {
  it('verbos, URL y cuerpo de cada acción', () => {
    const { ctrl } = configurar();
    const api = TestBed.inject(CatalogoApi);
    api.crearLibro({ titulo: 'Dune', isbn: '9780441172719', autores_ids: [1] }).subscribe();
    api.actualizarLibro(7, { titulo: 'Dune (ed. 2)' }).subscribe();
    api.borrarLibro(7).subscribe();
    const [crear] = ctrl.match('/api/v1/libros/');
    expect(crear.request.method).toBe('POST');
    expect(crear.request.body).toEqual({ titulo: 'Dune', isbn: '9780441172719', autores_ids: [1] });
    const [patch, del] = ctrl.match('/api/v1/libros/7/');
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ titulo: 'Dune (ed. 2)' });
    expect(del.request.method).toBe('DELETE');
  });

  it('subirPortada: PUT multipart con progreso, sin Content-Type a mano', () => {
    const { ctrl } = configurar();
    TestBed.inject(CatalogoApi)
      .subirPortada(3, new File(['x'], 'p.png', { type: 'image/png' }))
      .subscribe();
    const req = ctrl.expectOne('/api/v1/libros/3/portada/');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toBeInstanceOf(FormData);
    expect((req.request.body as FormData).get('portada')).toBeInstanceOf(File);
    expect(req.request.headers.has('Content-Type')).toBe(false);
    expect(req.request.reportProgress).toBe(true);
  });
});

describe('Interceptores', () => {
  it('cabeceras comunes solo hacia /api/', () => {
    const { http, ctrl } = configurar();
    http.get('/api/v1/generos/').subscribe();
    http.get('https://otra.example/x').subscribe();
    const api = ctrl.expectOne('/api/v1/generos/').request.headers;
    expect(api.get('Accept-Language')).toBe('es');
    expect(api.get('X-Request-ID')).toMatch(/^[0-9a-f-]{36}$/);
    expect(ctrl.expectOne('https://otra.example/x').request.headers.has('X-Request-ID')).toBe(
      false,
    );
  });

  it('X-Request-ID también sin crypto.randomUUID (http:// desde otro dispositivo de la red)', () => {
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });
    try {
      const { http, ctrl } = configurar();
      http.get('/api/v1/generos/').subscribe();
      const id = ctrl.expectOne('/api/v1/generos/').request.headers.get('X-Request-ID');
      expect(id).toMatch(/^[a-z0-9-]{8,64}$/); // lo que acepta el RequestIdMiddleware (módulo 16)
    } finally {
      delete (crypto as { randomUUID?: unknown }).randomUUID;
    }
    expect(typeof crypto.randomUUID).toBe('function');
  });

  it('pone el token y, ante 401 simultáneos, UN solo refresh y reintenta todas', async () => {
    const { http, ctrl, auth } = configurar();
    auth.establecerSesion('viejo', USUARIO_DE_PRUEBA);
    const respuestas = ['a', 'b', 'c'].map((n) => firstValueFrom(http.get(`/api/v1/${n}/`)));
    for (const n of ['a', 'b', 'c']) {
      const r = ctrl.expectOne(`/api/v1/${n}/`);
      expect(r.request.headers.get('Authorization')).toBe('Bearer viejo');
      r.flush(null, { status: 401, statusText: 'Unauthorized' });
    }
    const refresh = ctrl.expectOne('/api/v1/auth/refresh/'); // expectOne: si hubiera 2, fallaría
    expect(refresh.request.headers.has('Authorization')).toBe(false); // SIN_AUTH
    refresh.flush({ access: 'nuevo' });
    for (const n of ['a', 'b', 'c']) {
      const r = ctrl.expectOne(`/api/v1/${n}/`);
      expect(r.request.headers.get('Authorization')).toBe('Bearer nuevo');
      r.flush({ ok: n });
    }
    expect(await Promise.all(respuestas)).toEqual([{ ok: 'a' }, { ok: 'b' }, { ok: 'c' }]);
    expect(auth.access()).toBe('nuevo');
  });

  it('módulo 62: el token NO sale hacia otros dominios ni en las peticiones SIN_AUTH', () => {
    const { http, ctrl, auth } = configurar();
    auth.establecerSesion('secreto', USUARIO_DE_PRUEBA);
    http.get('https://otra.example/api/v1/x').subscribe(); // empieza por https, no por /api/
    http.get('/api/v1/publico/', { context: new HttpContext().set(SIN_AUTH, true) }).subscribe();
    http.get('/api/v1/privado/').subscribe();
    expect(
      ctrl.expectOne('https://otra.example/api/v1/x').request.headers.has('Authorization'),
    ).toBe(false);
    expect(ctrl.expectOne('/api/v1/publico/').request.headers.has('Authorization')).toBe(false);
    expect(ctrl.expectOne('/api/v1/privado/').request.headers.get('Authorization')).toBe(
      'Bearer secreto',
    );
  });

  it('módulo 62: restaurarSesion con cookie válida recupera token y usuario; sin cookie, nada', async () => {
    const { ctrl, auth } = configurar();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const conCookie = auth.restaurarSesion();
    ctrl.expectOne('/api/v1/auth/refresh/').flush({ access: 'recuperado' });
    ctrl.expectOne('/api/v1/auth/me/').flush(USUARIO_DE_PRUEBA);
    await conCookie;
    expect(auth.access()).toBe('recuperado');
    expect(auth.usuario()?.email).toBe(USUARIO_DE_PRUEBA.email);

    auth.logout();
    ctrl.expectOne('/api/v1/auth/logout/').flush(null);
    navegar.mockClear();
    const sinCookie = auth.restaurarSesion();
    ctrl.expectOne('/api/v1/auth/refresh/').flush({}, { status: 401, statusText: 'Unauthorized' });
    await expect(sinCookie).resolves.toBeNull(); // no lanza: la app arranca como anónima
    expect(auth.autenticado()).toBe(false);
    expect(navegar).not.toHaveBeenCalled(); // y no redirige: eso lo deciden los guards
  });

  it('si el refresh también falla: sesión cerrada en local (sin POST /logout/) y a /login', async () => {
    const { http, ctrl, auth } = configurar();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    auth.establecerSesion('viejo', USUARIO_DE_PRUEBA);
    const respuesta = firstValueFrom(http.get('/api/v1/a/')).catch((e) => e);
    ctrl.expectOne('/api/v1/a/').flush(null, { status: 401, statusText: 'Unauthorized' });
    ctrl.expectOne('/api/v1/auth/refresh/').flush({}, { status: 401, statusText: 'Unauthorized' });
    // el servidor ya ha rechazado la cookie: un /logout/ solo podría matar la de otra pestaña
    ctrl.expectNone('/api/v1/auth/logout/');
    expect(await respuesta).toBeInstanceOf(ErrorApi);
    expect(auth.autenticado()).toBe(false);
    expect(navegar).toHaveBeenCalledWith('/login');
  });

  it('refresh con 503 (un deploy): falla la petición, pero nadie sale de la sesión', async () => {
    const { http, ctrl, auth: pestanaA } = configurar();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const b = otraPestana();
    pestanaA.establecerSesion('viejo', USUARIO_DE_PRUEBA);
    b.auth.establecerSesion('b', USUARIO_DE_PRUEBA);
    const respuesta = firstValueFrom(http.get('/api/v1/a/')).catch((e) => e);
    ctrl.expectOne('/api/v1/a/').flush(null, { status: 401, statusText: 'Unauthorized' });
    ctrl
      .expectOne('/api/v1/auth/refresh/')
      .flush(null, { status: 503, statusText: 'Service Unavailable' });
    expect((await respuesta).status).toBe(503);
    for (let i = 0; i < 10; i++) await unTurno(); // margen de sobra para un aviso por BroadcastChannel
    expect(pestanaA.autenticado()).toBe(true); // la cookie sigue valiendo: el próximo 401 reintenta
    expect(b.auth.autenticado()).toBe(true);
    expect(navegar).not.toHaveBeenCalled();
    b.cerrar();
  });

  it('dos pestañas que refrescan a la vez: el cerrojo las pone en fila', async () => {
    const request = locksEnFila();
    try {
      const { ctrl, auth: pestanaA } = configurar();
      const b = otraPestana();
      const accesos = [pestanaA, b.auth].map((auth) => firstValueFrom(auth.refrescar()));
      await unTurno();
      // expectOne: solo UNA petición en vuelo; la otra pestaña espera su turno
      ctrl.expectOne('/api/v1/auth/refresh/').flush({ access: 'de-a' });
      await unTurno();
      ctrl.expectOne('/api/v1/auth/refresh/').flush({ access: 'de-b' }); // ya con la cookie rotada
      expect(await Promise.all(accesos)).toEqual(['de-a', 'de-b']);
      expect(request).toHaveBeenCalledTimes(2);
      expect(request.mock.calls.map(([nombre]) => nombre)).toEqual([
        'auth-refresh',
        'auth-refresh',
      ]);
      b.cerrar();
    } finally {
      delete (navigator as { locks?: unknown }).locks;
    }
  });

  it('un refresh colgado no retiene el cerrojo: falla al llegar al límite y pasa el siguiente', async () => {
    locksEnFila();
    try {
      const colgado = firstValueFrom(conCerrojo('auth-refresh', NEVER, 50)).catch((e) => e);
      const siguiente = firstValueFrom(conCerrojo('auth-refresh', of('ok'), 50));
      expect(await colgado).toBeInstanceOf(TimeoutError); // transitorio: no cierra la sesión
      expect(await siguiente).toBe('ok');
    } finally {
      delete (navigator as { locks?: unknown }).locks;
    }
  });

  it('"Salir" en una pestaña cierra la sesión en las demás, sin otro POST /logout/', async () => {
    const { ctrl, auth: pestanaA } = configurar();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const b = otraPestana();
    pestanaA.establecerSesion('a', USUARIO_DE_PRUEBA);
    b.auth.establecerSesion('b', USUARIO_DE_PRUEBA);

    pestanaA.logout();
    ctrl.expectOne('/api/v1/auth/logout/').flush(null); // uno: el de la pestaña que sale
    for (let i = 0; i < 50 && b.auth.autenticado(); i++) await unTurno(); // BroadcastChannel
    expect(b.auth.autenticado()).toBe(false);
    ctrl.expectNone('/api/v1/auth/logout/');
    expect(navegar).toHaveBeenCalledTimes(2); // las dos, a /login
    b.cerrar();
  });

  it('convierte los errores al formato de la API y avisa solo de los globales', async () => {
    const { http, ctrl } = configurar();
    const avisos = TestBed.inject(Avisos);
    const error400 = firstValueFrom(http.post('/api/v1/libros/', {})).catch((e) => e);
    ctrl.expectOne('/api/v1/libros/').flush(
      {
        type: 'validacion',
        title: 'Datos no válidos.',
        errors: { isbn: ['Obligatorio.'] },
        request_id: 'r1',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    const e = (await error400) as ErrorApi;
    expect(e).toBeInstanceOf(ErrorApi);
    expect([e.status, e.tipo, e.errores, e.requestId]).toEqual([
      400,
      'validacion',
      { isbn: ['Obligatorio.'] },
      'r1',
    ]);
    expect(avisos.lista()).toEqual([]); // un 400 lo trata la pantalla (el formulario)

    const error403 = firstValueFrom(http.delete('/api/v1/libros/1/')).catch((x) => x);
    ctrl
      .expectOne('/api/v1/libros/1/')
      .flush(
        { type: 'sin_permiso', title: 'No tienes permiso.', request_id: 'r2' },
        { status: 403, statusText: 'Forbidden' },
      );
    await error403;
    expect(avisos.lista().map((a) => a.texto)).toEqual(['No tienes permiso.']);
    expect(avisos.lista()[0].ref).toBe('r2'); // el request_id, para soporte

    const silencioso = firstValueFrom(
      http.delete('/api/v1/libros/2/', { context: new HttpContext().set(SIN_AVISO_ERROR, true) }),
    ).catch((x) => x);
    ctrl
      .expectOne('/api/v1/libros/2/')
      .flush({ title: 'No.' }, { status: 403, statusText: 'Forbidden' });
    await silencioso;
    expect(avisos.lista()).toHaveLength(1); // no ha añadido otro
  });

  it('reintenta un GET ante 503 (no un POST)', async () => {
    vi.useFakeTimers();
    const { http, ctrl } = configurar();
    const get = firstValueFrom(http.get('/api/v1/libros/'));
    ctrl.expectOne('/api/v1/libros/').flush(null, { status: 503, statusText: 'Unavailable' });
    await vi.advanceTimersByTimeAsync(1000);
    ctrl.expectOne('/api/v1/libros/').flush({ ok: true });
    expect(await get).toEqual({ ok: true });

    const post = firstValueFrom(http.post('/api/v1/libros/', {})).catch((e) => e);
    ctrl.expectOne('/api/v1/libros/').flush(null, { status: 503, statusText: 'Unavailable' });
    await vi.advanceTimersByTimeAsync(5000);
    ctrl.expectNone('/api/v1/libros/');
    expect((await post).status).toBe(503);
    vi.useRealTimers();
  });
});
