import { TestBed } from '@angular/core/testing';
import { Avisos } from './avisos';
import { AvisosGlobales } from './avisos-globales/avisos-globales';

describe('Avisos', () => {
  afterEach(() => vi.useRealTimers());

  it('éxito e info se cierran solos a los 5 s; un error se queda hasta que lo cierras', () => {
    vi.useFakeTimers();
    const avisos = TestBed.inject(Avisos);
    avisos.exito('Guardado');
    avisos.error('Error del servidor.', 'req-123');
    vi.advanceTimersByTime(5000);
    expect(avisos.lista()).toEqual([
      { id: 2, tipo: 'error', texto: 'Error del servidor.', ref: 'req-123' },
    ]);
    avisos.cerrar(2);
    expect(avisos.lista()).toEqual([]);
  });

  it('pinta los errores en un role="alert", con la referencia para soporte', async () => {
    const fixture = TestBed.createComponent(AvisosGlobales);
    const avisos = TestBed.inject(Avisos);
    avisos.error('Error del servidor.', 'req-123');
    avisos.info('Libro devuelto');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role=alert]')?.textContent).toContain('Ref. req-123');
    expect(el.querySelector('[role=status]')?.textContent).toContain('Libro devuelto');
    expect(el.querySelector('[role=status]')?.textContent).not.toContain('Error');
  });
});
