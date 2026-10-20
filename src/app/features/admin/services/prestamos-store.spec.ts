import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth-store';
import { responder } from '../../../testing/responder';
import { iniciarSesionDePrueba } from '../../../testing/sesion';
import { PrestamosStore } from './prestamos-store';

const p = (
  id: number,
  titulo: string,
  estado: 'activo' | 'devuelto',
  limite = '2099-01-01T00:00:00Z',
) => ({
  id,
  libro: { id, titulo, isbn: '9780441172719' },
  ejemplar: `E-${id}`,
  estado,
  fecha_inicio: '2026-10-01T00:00:00Z',
  fecha_limite: limite,
  multa: null,
});

describe('PrestamosStore (NgRx SignalStore)', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
  });

  it('carga los activos al crearse y calcula los vencidos', async () => {
    const store = TestBed.inject(PrestamosStore);
    TestBed.tick();
    const req = await responder(http, '/api/v1/prestamos/', {
      next: null,
      previous: null,
      results: [p(1, 'Dune', 'activo'), p(2, 'Fundación', 'activo', '2020-01-01T00:00:00Z')],
    });
    expect(req.params.toString()).toBe('estado=activo');
    expect(store.entities()).toHaveLength(2);
    expect(store.totalVencidos()).toBe(1);
    expect(store.cargando()).toBe(false);
  });

  it('cambiar el filtro recarga (y cancela la petición anterior)', async () => {
    const store = TestBed.inject(PrestamosStore);
    TestBed.tick();
    store.cambiarFiltro('vencidos');
    TestBed.tick();
    const [primera] = http.match('/api/v1/prestamos/?estado=activo');
    expect(primera.cancelled).toBe(true); // switchMap
    await responder(http, '/api/v1/prestamos/vencidos/', {
      next: null,
      previous: null,
      results: [p(2, 'Fundación', 'activo', '2020-01-01T00:00:00Z')],
    });
    expect(store.visibles().map((x) => x.libro.titulo)).toEqual(['Fundación']);
  });

  it('buscar filtra lo cargado; devolver actualiza la entidad', async () => {
    const store = TestBed.inject(PrestamosStore);
    TestBed.tick();
    await responder(http, '/api/v1/prestamos/', {
      next: null,
      previous: null,
      results: [p(1, 'Dune', 'activo'), p(2, 'Fundación', 'activo')],
    });
    store.buscar('fund');
    expect(store.visibles().map((x) => x.id)).toEqual([2]);

    const devolucion = store.devolver(2);
    await responder(http, '/api/v1/prestamos/2/devolver/', p(2, 'Fundación', 'devuelto'));
    await devolucion;
    expect(store.entityMap()[2].estado).toBe('devuelto');
    expect(store.entityMap()[1].estado).toBe('activo');
  });

  it('error de la API → mensaje y sin "cargando"', async () => {
    const store = TestBed.inject(PrestamosStore);
    TestBed.tick();
    await responder(http, '/api/v1/prestamos/', null, { status: 500, statusText: 'Error' });
    expect(store.error()).toBe('No se pudieron cargar los préstamos');
    expect(store.cargando()).toBe(false);
  });

  it('logout → todo a cero', async () => {
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const store = TestBed.inject(PrestamosStore);
    TestBed.tick();
    await responder(http, '/api/v1/prestamos/', {
      next: null,
      previous: null,
      results: [p(1, 'Dune', 'activo')],
    });
    store.buscar('dune');
    iniciarSesionDePrueba();
    TestBed.inject(AuthStore).logout();
    expect(store.entities()).toEqual([]);
    expect(store.busqueda()).toBe('');
  });
});
