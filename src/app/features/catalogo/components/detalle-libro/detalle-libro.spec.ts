import { TestBed } from '@angular/core/testing';
import { DetalleLibro } from './detalle-libro';

describe('DetalleLibro', () => {
  it('combina Tarjeta y Pestanas con el libro de la API (autores como objetos)', async () => {
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
});
