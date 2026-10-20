import { TestBed } from '@angular/core/testing';
import { PrestamosApiFalsa } from '../../services/prestamos-api-falsa';
import { ListadoPrestamos } from './listado-prestamos';

describe('ListadoPrestamos (rxResource)', () => {
  it('recarga al cambiar estado o página y vuelve a la 1 al filtrar', async () => {
    const fixture = TestBed.createComponent(ListadoPrestamos);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const titulos = () => [...el.querySelectorAll('li')].map((li) => li.textContent?.trim());
    expect(titulos()).toEqual(['Libro 1', 'Libro 2']);
    expect(el.querySelector('.total')?.textContent).toBe('5 en total · página 1');

    el.querySelector<HTMLButtonElement>('button')!.click(); // Siguiente
    await fixture.whenStable();
    expect(titulos()).toEqual(['Libro 3', 'Libro 4']);

    const select = el.querySelector('select')!;
    select.value = 'devuelto';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(titulos()).toEqual(['Libro 4', 'Libro 5']);
    expect(el.querySelector('.total')?.textContent).toBe('2 en total · página 1');

    expect(TestBed.inject(PrestamosApiFalsa).consultas).toEqual([
      { estado: '', pagina: 1 },
      { estado: '', pagina: 2 },
      { estado: 'devuelto', pagina: 1 }, // UNA consulta: estado y página cambian juntos
    ]);
  });
});
