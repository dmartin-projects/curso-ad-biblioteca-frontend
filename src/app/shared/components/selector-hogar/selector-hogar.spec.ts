import { TestBed } from '@angular/core/testing';
import { Hogar, SelectorHogar } from './selector-hogar';

const CASA: Hogar = { id: 1, nombre: 'Casa' };
const PLAYA: Hogar = { id: 2, nombre: 'Apartamento playa' };
const PADRES: Hogar = { id: 3, nombre: 'Casa de mis padres' };

describe('SelectorHogar (linkedSignal)', () => {
  it('conserva la selección si sigue en la lista; si no, vuelve al primero', async () => {
    const fixture = TestBed.createComponent(SelectorHogar);
    fixture.componentRef.setInput('hogares', [CASA, PLAYA]);
    await fixture.whenStable();
    const cmp = fixture.componentInstance;
    expect(cmp.seleccionado()).toEqual(CASA); // por defecto, el primero

    const select = (fixture.nativeElement as HTMLElement).querySelector('select')!;
    select.value = '2';
    select.dispatchEvent(new Event('change'));
    expect(cmp.seleccionado()).toEqual(PLAYA); // escribible por el usuario

    fixture.componentRef.setInput('hogares', [PADRES, PLAYA]); // llega una lista nueva…
    expect(cmp.seleccionado()).toEqual(PLAYA); // …y PLAYA sigue: se conserva

    fixture.componentRef.setInput('hogares', [PADRES]);
    expect(cmp.seleccionado()).toEqual(PADRES); // ya no está: el primero
  });

  it('emite el hogar elegido', async () => {
    const fixture = TestBed.createComponent(SelectorHogar);
    fixture.componentRef.setInput('hogares', [CASA, PLAYA]);
    await fixture.whenStable();
    const elegidos: Hogar[] = [];
    fixture.componentInstance.cambio.subscribe((h) => elegidos.push(h));
    fixture.componentInstance.elegir('2');
    expect(elegidos).toEqual([PLAYA]);
  });
});
