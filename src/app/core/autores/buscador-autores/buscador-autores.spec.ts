import { TestBed } from '@angular/core/testing';
import { BuscadorAutores } from './buscador-autores';
import { AutoresApiFalsa } from '../autores-api-falsa';

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('BuscadorAutores', () => {
  it('busca con debounce, muestra resultados y sobrevive a un error', async () => {
    const fixture = TestBed.createComponent(BuscadorAutores);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector('input')!;
    const escribir = (v: string) => {
      input.value = v;
      input.dispatchEvent(new Event('input'));
    };

    escribir('is');
    escribir('isa');
    await esperar(550); // 300 de debounce + 200 de latencia
    await fixture.whenStable();
    expect([...el.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      'Isaac Asimov',
      'Isabel Allende',
    ]);
    expect(TestBed.inject(AutoresApiFalsa).llamadas).toBe(1); // 'is' no llegó a buscarse

    escribir('error');
    await esperar(350);
    await fixture.whenStable();
    expect(el.querySelector('[role=alert]')?.textContent).toBe('No se pudo buscar');

    escribir('herbert');
    await esperar(550);
    await fixture.whenStable();
    expect(el.querySelector('[role=alert]')).toBeNull();
    expect(el.querySelector('li')?.textContent).toBe('Frank Herbert');
  });
});
