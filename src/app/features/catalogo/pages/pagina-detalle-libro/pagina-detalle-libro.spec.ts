import { TestBed } from '@angular/core/testing';
import { LIBROS_DE_PRUEBA } from '../../services/datos-prueba';
import { PaginaDetalleLibro } from './pagina-detalle-libro';

const esperar = (ms = 0) => new Promise((r) => setTimeout(r, ms));
const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });

describe('PaginaDetalleLibro (resource + fetch)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('spinner → detalle; error → reintentar', async () => {
    const fetchFalso = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(LIBROS_DE_PRUEBA[0]))
      .mockResolvedValueOnce(json({ detail: 'No encontrado.' }, 404))
      .mockResolvedValueOnce(json(LIBROS_DE_PRUEBA[1]));
    vi.stubGlobal('fetch', fetchFalso);

    const fixture = TestBed.createComponent(PaginaDetalleLibro);
    fixture.componentRef.setInput('id', 1);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.spinner')).not.toBeNull();

    await fixture.whenStable(); // los recursos cuentan como "tarea pendiente": whenStable los espera
    expect(el.querySelector('h2')?.textContent).toBe('Dune');
    expect(fetchFalso).toHaveBeenLastCalledWith(
      '/api/v1/libros/1/',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    fixture.componentRef.setInput('id', 99);
    await fixture.whenStable();
    expect(el.querySelector('[role=alert]')?.textContent).toContain('Error 404');

    el.querySelector<HTMLButtonElement>('[role=alert] button')!.click(); // Reintentar
    await fixture.whenStable();
    expect(el.querySelector('h2')?.textContent).toBe('Cien años de soledad');
  });

  it('si cambia el id mientras carga, aborta la petición anterior', async () => {
    const señales: AbortSignal[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init: RequestInit) => {
        señales.push(init.signal!);
        return esperar(50).then(() => json(LIBROS_DE_PRUEBA[0]));
      }),
    );
    const fixture = TestBed.createComponent(PaginaDetalleLibro);
    fixture.componentRef.setInput('id', 1);
    fixture.detectChanges();
    await esperar(10);
    fixture.componentRef.setInput('id', 2);
    await fixture.whenStable();
    expect(señales).toHaveLength(2);
    expect(señales[0].aborted).toBe(true);
    expect(señales[1].aborted).toBe(false);
  });
});
