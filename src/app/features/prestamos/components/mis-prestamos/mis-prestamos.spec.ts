import { TestBed } from '@angular/core/testing';
import { MisPrestamos } from './mis-prestamos';

describe('MisPrestamos', () => {
  it('reutiliza Lista<T> con otra plantilla', async () => {
    const fixture = TestBed.createComponent(MisPrestamos);
    fixture.componentRef.setInput('prestamos', [
      {
        id: 9,
        libro: { id: 1, titulo: 'Dune' },
        fecha_limite: '2026-11-15T10:00:00Z',
        estado: 'activo',
      },
    ]);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('li')?.textContent?.trim()).toBe(
      'Dune — devolver antes del 15/11/2026',
    );
    fixture.componentRef.setInput('prestamos', []);
    await fixture.whenStable();
    expect(el.querySelector('li')?.textContent).toBe('No tienes préstamos.');
  });
});
