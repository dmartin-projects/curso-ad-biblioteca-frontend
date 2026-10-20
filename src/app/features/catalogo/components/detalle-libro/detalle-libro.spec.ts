import { TestBed } from '@angular/core/testing';
import { LIBROS_DE_PRUEBA } from '../../services/datos-prueba';
import { DetalleLibro } from './detalle-libro';

describe('DetalleLibro', () => {
  it('combina Tarjeta y Pestanas', async () => {
    const fixture = TestBed.createComponent(DetalleLibro);
    fixture.componentRef.setInput('libro', LIBROS_DE_PRUEBA[0]);
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
