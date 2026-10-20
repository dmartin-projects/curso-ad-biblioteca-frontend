import { TestBed } from '@angular/core/testing';
import { EventosGastos } from '../../services/eventos-gastos';
import { GastosApiFalsa } from '../../services/gastos-api-falsa';
import { ListadoGastos } from './listado-gastos';

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('ListadoGastos', () => {
  it('doble clic = un guardado, y el listado se refresca con el evento', async () => {
    const fixture = TestBed.createComponent(ListadoGastos);
    await esperar(60);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const conceptos = () => [...el.querySelectorAll('li')].map((li) => li.textContent);
    expect(conceptos()).toEqual(['Mercadona']);

    const boton = el.querySelector('button')!;
    boton.click();
    boton.click(); // doble clic: exhaustMap lo ignora
    await esperar(400); // 300 del guardado + 50 del listado
    await fixture.whenStable();

    const api = TestBed.inject(GastosApiFalsa);
    expect(api.llamadasCrear).toBe(1);
    expect(api.llamadasListar).toBe(2); // la carga inicial + el refresco tras guardar
    expect(conceptos()).toEqual(['Mercadona', 'Nuevo gasto']);
  });

  it('se refresca aunque el gasto lo guarde OTRO componente', async () => {
    const fixture = TestBed.createComponent(ListadoGastos);
    await esperar(60);
    TestBed.inject(EventosGastos).notificarGuardado({ id: 99, concepto: 'x' });
    await esperar(60);
    await fixture.whenStable();
    expect(TestBed.inject(GastosApiFalsa).llamadasListar).toBe(2);
  });

  it('desde fuera no se puede emitir en guardado$', () => {
    const eventos = TestBed.inject(EventosGastos);
    expect('next' in eventos.guardado$).toBe(false);
  });
});
