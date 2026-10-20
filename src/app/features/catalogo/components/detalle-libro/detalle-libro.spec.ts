import { TestBed } from '@angular/core/testing';
import { DetalleLibro } from './detalle-libro';

describe('DetalleLibro', () => {
  it('combina Tarjeta y pestañas (@angular/aria) con el libro de la API (autores como objetos)', async () => {
    const fixture = TestBed.createComponent(DetalleLibro);
    fixture.componentRef.setInput('libro', {
      id: 1,
      titulo: 'Dune',
      isbn: '9780441172719',
      publicado: '1965-08-01',
      autores: [{ id: 1, nombre: 'Frank', apellidos: 'Herbert', slug: 'frank-herbert' }],
    });
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-tarjeta header')?.textContent?.trim()).toBe('Dune');
    expect(el.querySelector('[role=tabpanel]')?.textContent).toContain('Frank Herbert');
    const ids: number[] = [];
    fixture.componentInstance.reservar.subscribe((id) => ids.push(id));
    el.querySelector<HTMLButtonElement>('footer button')!.click();
    expect(ids).toEqual([1]);
  });

  it('pestañas accesibles: roles, aria-selected y flechas del teclado (módulo 59)', async () => {
    const fixture = TestBed.createComponent(DetalleLibro);
    fixture.componentRef.setInput('libro', {
      id: 1,
      titulo: 'Dune',
      isbn: '9780441172719',
      publicado: '1965-08-01',
      sinopsis: 'Arrakis.',
      autores: [],
    });
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const pestanas = Array.from(el.querySelectorAll<HTMLElement>('[role=tab]'));
    expect(el.querySelector('[role=tablist]')).not.toBeNull();
    expect(pestanas.map((p) => p.getAttribute('aria-selected'))).toEqual(['true', 'false']);
    expect(pestanas.map((p) => p.tabIndex)).toEqual([0, -1]); // un solo Tab para toda la lista

    pestanas[0].focus();
    pestanas[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await fixture.whenStable();
    expect(pestanas.map((p) => p.getAttribute('aria-selected'))).toEqual(['false', 'true']);
    const panel = el.querySelector(`#${pestanas[1].getAttribute('aria-controls')}`);
    expect(panel?.textContent).toContain('Arrakis.');
  });
});
