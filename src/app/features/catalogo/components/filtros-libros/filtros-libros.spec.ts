import { TestBed } from '@angular/core/testing';
import { FiltrosLibro } from '../../interfaces/catalogo.models';
import { FiltrosLibros } from './filtros-libros';

describe('FiltrosLibros (presentación)', () => {
  async function crear() {
    const fixture = TestBed.createComponent(FiltrosLibros);
    fixture.componentRef.setInput('filtros', { texto: 'du', soloDisponibles: true });
    await fixture.whenStable();
    const emitidos: FiltrosLibro[] = [];
    fixture.componentInstance.cambio.subscribe((f) => emitidos.push(f));
    return { el: fixture.nativeElement as HTMLElement, emitidos };
  }

  it('emite los filtros completos al cambiar uno', async () => {
    const { el, emitidos } = await crear();
    const campo = el.querySelector<HTMLInputElement>('input[type=search]')!;
    expect(campo.value).toBe('du');
    campo.value = 'dune';
    campo.dispatchEvent(new Event('input'));
    campo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(emitidos).toEqual([
      { texto: 'dune', soloDisponibles: true },
      { texto: '', soloDisponibles: true },
    ]);
  });

  it('"/" enfoca el buscador, salvo si ya estás escribiendo', async () => {
    const { el } = await crear();
    const campo = el.querySelector<HTMLInputElement>('input[type=search]')!;
    const evento = new KeyboardEvent('keydown', { key: '/', cancelable: true });
    document.dispatchEvent(evento);
    expect(document.activeElement).toBe(campo);
    expect(evento.defaultPrevented).toBe(true);
    const dentro = new KeyboardEvent('keydown', { key: '/', cancelable: true, bubbles: true });
    campo.dispatchEvent(dentro);
    expect(dentro.defaultPrevented).toBe(false);
  });
});
