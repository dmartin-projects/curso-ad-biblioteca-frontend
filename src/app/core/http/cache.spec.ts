import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom, forkJoin, shareReplay } from 'rxjs';
import { GenerosApi, GenerosStore } from '../generos/generos';
import { USUARIO_DE_PRUEBA } from '../../testing/sesion';
import { AuthStore } from '../auth/auth-store';
import { CACHEAR, cacheInterceptor, CacheHttp } from './cache';

const conCache = (ttl: number) => ({ context: new HttpContext().set(CACHEAR, ttl) });

function configurar() {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([cacheInterceptor])),
      provideHttpClientTesting(),
      provideRouter([]),
    ],
  });
  return {
    http: TestBed.inject(HttpClient),
    ctrl: TestBed.inject(HttpTestingController),
    cache: TestBed.inject(CacheHttp),
  };
}

describe('1. share(): sin peticiones duplicadas simultáneas', () => {
  it('tres suscriptores a la vez → una petición; la siguiente vuelve a pedir', async () => {
    const { ctrl } = configurar();
    const api = TestBed.inject(GenerosApi);
    const tres = firstValueFrom(forkJoin([api.generos$, api.generos$, api.generos$]));
    ctrl.expectOne('/api/v1/generos/').flush([{ id: 1, nombre: 'Novela' }]);
    expect((await tres).map((l) => l.length)).toEqual([1, 1, 1]);
    firstValueFrom(api.generos$);
    ctrl.expectOne('/api/v1/generos/'); // otra petición: share se reinicia al completar
  });

  it('shareReplay, en cambio, guarda la respuesta para siempre (con o sin refCount)', async () => {
    const { http, ctrl } = configurar();
    const generos$ = http
      .get('/api/v1/generos/')
      .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    const dos = firstValueFrom(forkJoin([generos$, generos$]));
    ctrl.expectOne('/api/v1/generos/').flush([]);
    await dos;
    expect(await firstValueFrom(generos$)).toEqual([]);
    ctrl.expectNone('/api/v1/generos/'); // la petición HTTP completó: es una caché sin caducidad
  });
});

describe('2. GenerosStore', () => {
  @Component({ template: '{{ store.generos.value().length }}' })
  class Pantalla {
    readonly store = inject(GenerosStore);
  }

  it('dos pantallas, una petición; invalidar recarga (también saltándose la caché HTTP)', async () => {
    const { ctrl } = configurar();
    const a = TestBed.createComponent(Pantalla);
    const b = TestBed.createComponent(Pantalla);
    a.detectChanges();
    b.detectChanges();
    TestBed.tick();
    ctrl.expectOne('/api/v1/generos/').flush([{ id: 1, nombre: 'Novela' }]);
    await a.whenStable();
    expect([a.nativeElement.textContent, b.nativeElement.textContent]).toEqual(['1', '1']);

    TestBed.inject(GenerosStore).invalidar();
    TestBed.tick();
    ctrl.expectOne('/api/v1/generos/').flush([
      { id: 1, nombre: 'Novela' },
      { id: 2, nombre: 'Poesía' },
    ]);
    await b.whenStable();
    expect(b.nativeElement.textContent).toBe('2');
  });

  it('crear añade el género localmente, sin volver a pedir la lista', async () => {
    const { ctrl } = configurar();
    const store = TestBed.inject(GenerosStore);
    TestBed.tick();
    ctrl.expectOne('/api/v1/generos/').flush([{ id: 1, nombre: 'Novela' }]);
    await new Promise((r) => setTimeout(r));
    const creado = firstValueFrom(store.crear('Ensayo'));
    ctrl.expectOne((r) => r.method === 'POST').flush({ id: 9, nombre: 'Ensayo' });
    await creado;
    expect(store.generos.value().map((g) => g.nombre)).toEqual(['Ensayo', 'Novela']);
    ctrl.verify(); // ningún GET extra
  });
});

describe('3. cacheInterceptor', () => {
  it('opt-in: sin CACHEAR siempre va a la red', () => {
    const { http, ctrl } = configurar();
    http.get('/api/v1/x/').subscribe();
    http.get('/api/v1/x/').subscribe();
    expect(ctrl.match('/api/v1/x/')).toHaveLength(2);
  });

  it('con TTL: la segunda vez sale de la caché; caducado, a la red', async () => {
    vi.useFakeTimers();
    const { http, ctrl } = configurar();
    const primera = firstValueFrom(http.get('/api/v1/generos/', conCache(60_000)));
    ctrl.expectOne('/api/v1/generos/').flush(['a']);
    expect(await primera).toEqual(['a']);
    expect(await firstValueFrom(http.get('/api/v1/generos/', conCache(60_000)))).toEqual(['a']);
    ctrl.expectNone('/api/v1/generos/');

    vi.advanceTimersByTime(61_000);
    http.get('/api/v1/generos/', conCache(60_000)).subscribe();
    ctrl.expectOne('/api/v1/generos/');
    vi.useRealTimers();
  });

  it('la clave incluye los parámetros', () => {
    const { http, ctrl } = configurar();
    http.get('/api/v1/libros/', { ...conCache(60_000), params: { page: 1 } }).subscribe();
    ctrl.expectOne('/api/v1/libros/?page=1').flush({});
    http.get('/api/v1/libros/', { ...conCache(60_000), params: { page: 2 } }).subscribe();
    ctrl.expectOne('/api/v1/libros/?page=2');
  });

  it('una escritura que sale bien invalida el recurso entero (por prefijo)', () => {
    const { http, ctrl, cache } = configurar();
    for (const url of ['/api/v1/libros/', '/api/v1/libros/7/', '/api/v1/generos/']) {
      http.get(url, conCache(60_000)).subscribe();
      ctrl.expectOne(url).flush({});
    }
    expect(cache.tamano).toBe(3);
    http.patch('/api/v1/libros/7/portada/', {}).subscribe();
    ctrl.expectOne('/api/v1/libros/7/portada/').flush({});
    expect(cache.tamano).toBe(1); // solo queda /generos/
  });

  it('LRU: nunca más de 100 entradas; se va la menos usada', () => {
    const { http, ctrl, cache } = configurar();
    for (let i = 0; i < 105; i++) {
      http.get(`/api/v1/x/${i}/`, conCache(60_000)).subscribe();
      ctrl.expectOne(`/api/v1/x/${i}/`).flush({});
      if (i === 50) cache.obtener('/api/v1/x/0/'); // usar la 0 la "rejuvenece"
    }
    expect(cache.tamano).toBe(100);
    expect(cache.obtener('/api/v1/x/0/')).toBeDefined();
    expect(cache.obtener('/api/v1/x/1/')).toBeUndefined();
  });

  it('el logout vacía la caché', () => {
    const { http, ctrl, cache } = configurar();
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    http.get('/api/v1/generos/', conCache(60_000)).subscribe();
    ctrl.expectOne('/api/v1/generos/').flush([]);
    const auth = TestBed.inject(AuthStore);
    auth.establecerSesion('t', USUARIO_DE_PRUEBA);
    auth.logout();
    expect(cache.tamano).toBe(0);
  });
});
