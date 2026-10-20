import { TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';

describe('Dashboard (ngComponentOutlet)', () => {
  it('pinta cada widget según la configuración, en orden y con sus inputs', async () => {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.componentRef.setInput('widgets', [
      { id: 1, tipo: 'aviso', config: { texto: 'Vence mañana' } },
      { id: 2, tipo: 'total', config: { total: 7, etiqueta: 'libros' } },
      { id: 3, tipo: 'lista', config: { lineas: ['Dune'] } },
    ]);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const etiquetas = Array.from(el.children).map((c) => c.tagName.toLowerCase());
    expect(etiquetas).toEqual(['app-widget-aviso', 'app-widget-total', 'app-widget-lista']);
    expect(el.textContent).toContain('7 libros');
    expect(el.textContent).toContain('Vence mañana');
  });
});
