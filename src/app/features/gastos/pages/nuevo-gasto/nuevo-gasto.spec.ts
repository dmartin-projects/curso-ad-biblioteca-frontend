import { TestBed } from '@angular/core/testing';
import { provideLocaleEs } from '../../../../core/locale';
import { Avisos } from '../../../../core/avisos/avisos';
import NuevoGasto from './nuevo-gasto';

describe('NuevoGasto (líneas dinámicas + control propio)', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: provideLocaleEs() }));

  async function crear() {
    const fixture = TestBed.createComponent(NuevoGasto);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const escribir = (input: Element, v: string) => {
      (input as HTMLInputElement).value = v;
      input.dispatchEvent(new Event('input'));
    };
    return { fixture, el, cmp: fixture.componentInstance, escribir };
  }

  it('añadir/quitar líneas, total calculado y reglas por línea (applyEach)', async () => {
    const { fixture, el, cmp, escribir } = await crear();
    [...el.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Añadir línea'))!
      .click();
    await fixture.whenStable();
    const lineas = () => [...el.querySelectorAll('fieldset.linea')];
    expect(lineas()).toHaveLength(2);

    const [desc0, cant0, precio0] = lineas()[0].querySelectorAll('input');
    escribir(desc0, 'Pan');
    escribir(cant0, '2');
    escribir(precio0, '1.25');
    const [desc1, , precio1] = lineas()[1].querySelectorAll('input');
    escribir(desc1, 'Leche');
    escribir(precio1, '0.99');
    await fixture.whenStable();
    expect(cmp.total()).toBeCloseTo(3.49);
    expect(el.querySelector('.total')?.textContent).toBe('Total: 3,49 €');

    lineas()[0].querySelector<HTMLButtonElement>('button')!.click(); // quitar la primera
    await fixture.whenStable();
    expect(cmp.modelo().lineas.map((l) => l.descripcion)).toEqual(['Leche']);
    expect(lineas()[0].querySelector('input')!.value).toBe('Leche'); // el campo sigue a SU línea
  });

  it('no se guarda sin comercio, categoría ni líneas; con todo, sí', async () => {
    const { fixture, el, cmp, escribir } = await crear();
    const avisos = TestBed.inject(Avisos);
    lineasQuitar(el);
    await fixture.whenStable();
    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
    const errores = [...el.querySelectorAll('.error')].map((e) => e.textContent?.trim());
    expect(errores).toEqual([
      'El comercio es obligatorio',
      'Elige una categoría',
      'Añade al menos una línea',
    ]);
    expect(avisos.lista()).toEqual([]);

    escribir(el.querySelectorAll('input')[1], 'Mercadona');
    el.querySelector<HTMLInputElement>('input[type=radio]')!.click(); // control propio: categoría 1
    cmp.anadirLinea();
    await fixture.whenStable();
    escribir(el.querySelector('fieldset.linea input')!, 'Pan');
    await fixture.whenStable();
    expect(cmp.modelo().categoria).toBe(1);
    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await new Promise((r) => setTimeout(r));
    // formatCurrency en español: coma decimal y un espacio de no separación (\u00a0) antes del €
    expect(avisos.lista().map((a) => a.texto)).toEqual(['Gasto de 0,00\u00a0€ guardado']);
  });
});

function lineasQuitar(el: HTMLElement) {
  el.querySelectorAll<HTMLButtonElement>('fieldset.linea button').forEach((b) => b.click());
}
