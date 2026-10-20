import { Component, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, Subject, switchMap } from 'rxjs';
import { EventosGastos } from '../../features/gastos/services/eventos-gastos';
import {
  ContadorGuardados,
  ListaGastosDestroyRef,
  ListaGastosFuga,
  ListaGastosTud,
} from './listas-gastos';
import { Reloj } from './reloj';

/** Ejercicio 5: entrar y salir N veces y contar cuántas veces se ejecuta recargar(). */
function entrarYSalir(clase: Type<{ recargar(): void }>, veces: number) {
  // espiamos el PROTOTIPO: cuenta las llamadas de TODAS las instancias, vivas o muertas
  const recargar = vi.spyOn(clase.prototype, 'recargar').mockImplementation(() => {});
  for (let i = 0; i < veces; i++) TestBed.createComponent(clase).destroy();
  const viva = TestBed.createComponent(clase);
  TestBed.inject(EventosGastos).notificarGuardado({ id: 1, concepto: 'x' });
  viva.destroy();
  return recargar.mock.calls.length;
}

describe('Fugas: entrar y salir 5 veces y guardar un gasto', () => {
  it('❌ con fuga: recargar() se ejecuta 6 veces (5 en componentes muertos)', () => {
    expect(entrarYSalir(ListaGastosFuga, 5)).toBe(6);
  });
  it('✅ takeUntilDestroyed: 1', () => {
    expect(entrarYSalir(ListaGastosTud, 5)).toBe(1);
  });
  it('✅ DestroyRef + unsubscribe: 1', () => {
    expect(entrarYSalir(ListaGastosDestroyRef, 5)).toBe(1);
  });
  it('✅ toSignal para pintar lo derivado del flujo', async () => {
    const f = TestBed.createComponent(ContadorGuardados);
    const eventos = TestBed.inject(EventosGastos);
    eventos.notificarGuardado({ id: 1, concepto: 'a' });
    eventos.notificarGuardado({ id: 2, concepto: 'b' });
    await f.whenStable();
    expect((f.nativeElement as HTMLElement).textContent).toBe('2 gastos guardados');
  });
});

describe('takeUntilDestroyed debe ir el último', () => {
  @Component({ template: '' })
  class MalOrden {
    readonly fuente = new Subject<void>();
    readonly recibidos: number[] = [];
    constructor() {
      this.fuente
        .pipe(
          takeUntilDestroyed(), // ❌ antes del switchMap
          switchMap(() => interval(10)),
        )
        .subscribe((n) => this.recibidos.push(n));
    }
  }

  it('si va antes de switchMap, el interno sigue vivo tras destruir', async () => {
    const f = TestBed.createComponent(MalOrden);
    f.componentInstance.fuente.next();
    f.destroy();
    await new Promise((r) => setTimeout(r, 55));
    expect(f.componentInstance.recibidos.length).toBeGreaterThan(2); // ¡sigue recibiendo!
  });
});

describe('Ejercicio 3: Reloj', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('limpia el setInterval y el listener de resize al destruirse', async () => {
    const f = TestBed.createComponent(Reloj);
    vi.advanceTimersByTime(3000);
    expect(f.componentInstance.segundos()).toBe(3);
    window.dispatchEvent(new Event('resize'));

    f.destroy();
    const ancho = f.componentInstance.ancho();
    Object.defineProperty(window, 'innerWidth', { value: 123, configurable: true });
    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(5000);
    expect(f.componentInstance.segundos()).toBe(3); // el intervalo ya no corre
    expect(f.componentInstance.ancho()).toBe(ancho); // el listener ya no está
    expect(vi.getTimerCount()).toBe(0); // ningún temporizador pendiente
  });
});
