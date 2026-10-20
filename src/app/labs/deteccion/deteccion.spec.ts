import { TestBed } from '@angular/core/testing';
import { TextareaAutoajustable } from '../../shared/components/textarea-autoajustable/textarea-autoajustable';
import { EjemploArreglado, EjemploParche, EjemploRoto, ServicioDatos } from './ejemplo';
import { PadreFiltros } from './filtros-mutados';

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const texto = (f: { nativeElement: unknown }) => (f.nativeElement as HTMLElement).textContent;

describe('1. Qué notifica un cambio (zoneless)', () => {
  it('propiedad en setTimeout y subscribe: NO se pinta… hasta que algo lo arrastra', async () => {
    const f = TestBed.createComponent(EjemploRoto);
    await f.whenStable();
    TestBed.inject(ServicioDatos).datos$.next(['a', 'b']);
    await esperar(150); // ya se ha ejecutado el setTimeout de "mensaje"
    await f.whenStable();
    expect(texto(f)).toBe('inicial — 0 — 0'); // ❌ ni mensaje ni lista
    await esperar(100); // ahora cambia la signal contador
    await f.whenStable();
    expect(texto(f)).toBe('cambiado — 1 — 2'); // la signal repinta y "arrastra" lo demás: trampa
  });

  it('con signals y toSignal todo se pinta en su momento', async () => {
    const f = TestBed.createComponent(EjemploArreglado);
    await f.whenStable();
    TestBed.inject(ServicioDatos).datos$.next(['a', 'b']);
    await esperar(150);
    await f.whenStable();
    expect(texto(f)).toBe('cambiado — 0 — 2');
  });

  it('markForCheck() parchea el código heredado', async () => {
    const f = TestBed.createComponent(EjemploParche);
    await esperar(150);
    await f.whenStable();
    expect(texto(f)).toBe('cambiado');
  });
});

describe('2. Mutar un input frente a reemplazarlo', () => {
  it('el hijo OnPush no ve la mutación; sí la referencia nueva', async () => {
    const f = TestBed.createComponent(PadreFiltros);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    el.querySelector<HTMLButtonElement>('#mutar')!.click();
    await f.whenStable();
    expect(el.querySelector('.padre')?.textContent).toBe('Padre: «dune»'); // el padre sí (el clic lo marca)
    expect(el.querySelector('.resumen')?.textContent).toBe('Buscando «»'); // ❌ el hijo no

    el.querySelector<HTMLButtonElement>('#reemplazar')!.click();
    await f.whenStable();
    expect(el.querySelector('.resumen')?.textContent).toBe('Buscando «dune»'); // ✅
  });
});

describe('3. TextareaAutoajustable', () => {
  it('ajusta la altura a scrollHeight al escribir y al borrar', async () => {
    const f = TestBed.createComponent(TextareaAutoajustable);
    await f.whenStable();
    const ta = (f.nativeElement as HTMLElement).querySelector('textarea')!;
    // jsdom no calcula layout: simulamos 20 px por línea
    Object.defineProperty(ta, 'scrollHeight', { get: () => 20 * ta.value.split('\n').length });
    for (const [valor, alto] of [
      ['a\nb\nc', '60px'],
      ['a', '20px'],
    ] as const) {
      ta.value = valor;
      ta.dispatchEvent(new Event('input'));
      await f.whenStable();
      expect(ta.style.height).toBe(alto);
    }
  });
});
