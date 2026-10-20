import { TestBed } from '@angular/core/testing';
import { Almacenamiento, AlmacenamientoMemoria } from '../../../../core/almacenamiento';
import { provideCatalogo } from '../../catalogo.config';
import { CarritoReservas } from '../../../../core/carrito/carrito-reservas';
import { CatalogoPage } from './catalogo-page';

async function crear() {
  const fixture = TestBed.createComponent(CatalogoPage);
  await fixture.whenStable();
  return { fixture, cmp: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
}

function escribir(el: HTMLElement, texto: string) {
  const campo = el.querySelector<HTMLInputElement>('input[type=search]')!;
  campo.value = texto;
  campo.dispatchEvent(new Event('input'));
}

const titulos = (el: HTMLElement) =>
  Array.from(el.querySelectorAll('app-libro-card h3')).map((h) => h.textContent);

describe('CatalogoPage (contenedor)', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideCatalogo({ tamanoPagina: 2 }),
        // cada test tiene su TestBed y, con él, un almacenamiento vacío: nada de localStorage.clear()
        { provide: Almacenamiento, useClass: AlmacenamientoMemoria },
      ],
    }),
  );

  it('pagina de 2 en 2 y vuelve a la página 1 al filtrar (linkedSignal)', async () => {
    const { fixture, cmp, el } = await crear();
    expect(titulos(el)).toEqual(['Dune', 'Cien años de soledad']);
    el.querySelectorAll<HTMLButtonElement>('app-paginador button')[1].click(); // Siguiente
    await fixture.whenStable();
    expect(cmp.pagina()).toBe(2);
    expect(titulos(el)).toEqual(['Hijos de Dune', 'La mano izquierda de la oscuridad']);

    escribir(el, 'dune');
    await fixture.whenStable();
    expect(cmp.pagina()).toBe(1);
    expect(cmp.total()).toBe(2);
  });

  it('el check "solo disponibles" quita los agotados', async () => {
    const { fixture, cmp, el } = await crear();
    const check = el.querySelector<HTMLInputElement>('input[type=checkbox]')!;
    check.checked = true;
    check.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(cmp.total()).toBe(4);
  });

  it('guarda los filtros y los recupera', async () => {
    const primero = await crear();
    escribir(primero.el, 'garcia');
    await primero.fixture.whenStable();
    const segundo = await crear();
    expect(segundo.cmp.filtros().texto).toBe('garcia');
    expect(segundo.cmp.total()).toBe(1);
  });

  it('vista compacta con Lista<T> y plantilla de fila', async () => {
    const { fixture, el } = await crear();
    Array.from(el.querySelectorAll('button'))
      .find((b) => b.textContent?.includes('Vista compacta'))!
      .click();
    await fixture.whenStable();
    const filas = Array.from(el.querySelectorAll('app-lista li')).map((li) =>
      li.textContent?.trim(),
    );
    expect(filas).toEqual([
      '1. Dune — Frank Herbert',
      '2. Cien años de soledad — Gabriel García Márquez',
    ]);
  });

  it('la reserva de la lista llega al carrito', async () => {
    const { el } = await crear();
    el.querySelector<HTMLButtonElement>('app-libro-card button')!.click();
    expect(TestBed.inject(CarritoReservas).total()).toBe(1);
  });

  it('exporta a CSV cargando el exportador bajo demanda (injectAsync)', async () => {
    const { cmp } = await crear();
    let blob: Blob | undefined;
    // jsdom no implementa createObjectURL: lo simulamos
    URL.createObjectURL = (b: Blob) => ((blob = b), 'blob:x');
    URL.revokeObjectURL = () => undefined;
    // y tampoco navega: evitamos el aviso "Not implemented: navigation"
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await cmp.exportar();
    const texto = await blob!.text();
    expect(texto).toContain('id;titulo;autores;disponibles');
    expect(texto).toContain('"Dune";"Frank Herbert"');
    expect(click).toHaveBeenCalledOnce();
    click.mockRestore();
  });

  it('usa el tamaño de página por defecto si nadie llama a provideCatalogo()', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: Almacenamiento, useClass: AlmacenamientoMemoria }],
    });
    const { el } = await crear();
    expect(el.querySelectorAll('app-libro-card').length).toBe(5); // 20 por página
  });
});
