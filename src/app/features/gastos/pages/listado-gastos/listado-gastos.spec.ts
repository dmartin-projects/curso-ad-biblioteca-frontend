import { TestBed } from '@angular/core/testing';
import { Almacenamiento, AlmacenamientoMemoria } from '../../../../core/almacenamiento';
import { HogarStore } from '../../../../core/hogar/hogar-store';
import { EventosGastos } from '../../services/eventos-gastos';
import { GastosApiFalsa } from '../../services/gastos-api-falsa';
import { ListadoGastos } from './listado-gastos';
import { hastaQue } from '../../../../testing/responder';

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('ListadoGastos', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [{ provide: Almacenamiento, useClass: AlmacenamientoMemoria }],
    }),
  );

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

  it('módulo 54: al cambiar de hogar activo, los gastos son los del otro hogar', async () => {
    const hogares = TestBed.inject(HogarStore);
    await hogares.cargar();
    const fixture = TestBed.createComponent(ListadoGastos);
    await esperar(60);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('li')?.textContent).toBe('Mercadona');
    hogares.seleccionar(2);
    // la API falsa tarda 50 ms: mejor esperar a la condición (con un límite) que adivinar un tiempo
    const conceptos = () => [...el.querySelectorAll('li')].map((li) => li.textContent);
    await hastaQue(fixture, () => conceptos()[0] === 'Chiringuito');
    expect([...el.querySelectorAll('li')].map((li) => li.textContent)).toEqual(['Chiringuito']);
  });
});
