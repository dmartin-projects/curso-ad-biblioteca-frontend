import { TestBed } from '@angular/core/testing';
import { provideLocaleEs } from '../../../../core/locale';
import { PrestamoResumen } from '../../interfaces/prestamos.models';
import { MisPrestamos } from './mis-prestamos';

const p = (id: number, titulo: string, fecha_limite: string): PrestamoResumen => ({
  id,
  libro: { id, titulo },
  fecha_limite,
  estado: 'activo',
});

describe('MisPrestamos', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: provideLocaleEs() }));

  it('reutiliza Lista<T>, formatea en español y pluraliza', async () => {
    const fixture = TestBed.createComponent(MisPrestamos);
    fixture.componentRef.setInput('ahora', Date.parse('2026-11-12T10:00:00Z'));
    fixture.componentRef.setInput('prestamos', [p(9, 'Dune', '2026-11-15T10:00:00Z')]);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h3')?.textContent).toBe('1 préstamo');
    expect(el.querySelector('li')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Dune — devolver antes del 15/11/2026 (vence dentro de 3 días)',
    );

    fixture.componentRef.setInput('prestamos', [
      p(1, 'A', '2026-11-11T10:00:00Z'),
      p(2, 'B', '2026-11-13T10:00:00Z'),
    ]);
    await fixture.whenStable();
    expect(el.querySelector('h3')?.textContent).toBe('2 préstamos');
    expect(el.textContent).toContain('vence ayer');
    expect(el.textContent).toContain('vence mañana');

    fixture.componentRef.setInput('prestamos', []);
    await fixture.whenStable();
    expect(el.querySelector('h3')?.textContent).toBe('Sin préstamos');
    expect(el.querySelector('li')?.textContent).toBe('No tienes préstamos.');
  });
});
