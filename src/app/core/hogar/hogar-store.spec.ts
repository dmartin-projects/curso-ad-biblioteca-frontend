import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { toSignal } from '@angular/core/rxjs-interop';
import { provideRouter, Router } from '@angular/router';
import { iniciarSesionDePrueba } from '../../testing/sesion';
import { Almacenamiento, AlmacenamientoMemoria } from '../almacenamiento';
import { AuthStore } from '../auth/auth-store';
import { HogarStore } from './hogar-store';
import { HogarStoreClasico } from './hogar-store-clasico';

describe('HogarStore (signals)', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [{ provide: Almacenamiento, useClass: AlmacenamientoMemoria }, provideRouter([])],
    }),
  );

  it('carga, selectores, selección persistida y alta', async () => {
    const store = TestBed.inject(HogarStore);
    const almacen = TestBed.inject(Almacenamiento);
    const carga = store.cargar();
    expect(store.cargando()).toBe(true);
    await carga;
    expect(store.hogares().map((h) => h.nombre)).toEqual(['Casa', 'Piso de la playa']);
    expect(store.activo()?.nombre).toBe('Casa'); // sin elección: el primero
    expect(store.soyAdmin()).toBe(true);

    store.seleccionar(2);
    TestBed.tick(); // el effect que persiste
    expect(store.soyAdmin()).toBe(false);
    expect(almacen.leer('hogarActivo')).toBe('2');

    await store.crear('Casa del pueblo');
    expect(store.activo()?.nombre).toBe('Casa del pueblo');
  });

  it('arranca con el hogar guardado', async () => {
    TestBed.inject(Almacenamiento).guardar('hogarActivo', '2');
    const store = TestBed.inject(HogarStore);
    await store.cargar();
    expect(store.activo()?.id).toBe(2);
  });

  it('se reinicia al cerrar sesión (sin que AuthStore lo conozca)', async () => {
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const store = TestBed.inject(HogarStore);
    await store.cargar();
    store.seleccionar(2);
    TestBed.tick();
    iniciarSesionDePrueba();
    TestBed.inject(AuthStore).logout();
    expect(store.hogares()).toEqual([]);
    expect(store.activo()).toBeNull();
    expect(TestBed.inject(Almacenamiento).leer('hogarActivo')).toBe('');
  });
});

describe('HogarStoreClasico (BehaviorSubject) desde un componente con toSignal', () => {
  @Component({ template: `{{ activo()?.nombre ?? '—' }}` })
  class Cabecera {
    private readonly store = inject(HogarStoreClasico);
    protected readonly activo = toSignal(this.store.activo$, { initialValue: null });
  }

  it('el componente moderno lee el store antiguo sin reescribirlo', async () => {
    const fixture = TestBed.createComponent(Cabecera);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toBe('—');
    const store = TestBed.inject(HogarStoreClasico);
    await store.cargar();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toBe('Casa');
    store.seleccionar(2);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toBe('Piso de la playa');
  });
});
