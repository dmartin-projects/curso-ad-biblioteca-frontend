import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideLocaleEs } from '../../../../core/locale';
import { EstadoFormularioGasto } from './estado-formulario-gasto';
import { FormularioGasto } from './formulario-gasto';

@Component({
  imports: [FormularioGasto],
  template: `<app-formulario-gasto id="a" /><app-formulario-gasto id="b" />`,
})
class DosFormularios {}

describe('EstadoFormularioGasto (provisto en el componente)', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: provideLocaleEs() }));

  it('dos formularios abiertos tienen estados independientes', async () => {
    const fixture = TestBed.createComponent(DosFormularios);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const boton = (id: string) => el.querySelector<HTMLButtonElement>(`#${id} button`)!;
    const total = (id: string) => el.querySelector(`#${id} .total`)?.textContent;

    boton('a').click();
    boton('a').click();
    boton('b').click();
    await fixture.whenStable();

    // el locale 'es' separa importe y símbolo con un espacio NO separable (U+00A0)
    expect(total('a')).toBe('Total: 3,00\u00a0€');
    expect(total('b')).toBe('Total: 1,50\u00a0€');
  });

  it('no existe fuera de un FormularioGasto', () => {
    expect(() => TestBed.inject(EstadoFormularioGasto)).toThrowError(/NG0201/);
  });
});
