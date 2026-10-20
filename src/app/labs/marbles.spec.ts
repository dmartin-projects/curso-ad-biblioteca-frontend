import { TestScheduler } from 'rxjs/testing';
import { concatMap, debounceTime, distinctUntilChanged, filter, mergeMap, switchMap } from 'rxjs';

/**
 * Módulo 62: marble tests. Cada carácter es 1 "frame" de tiempo virtual; "a", "b"… son valores,
 * "|" completa, "#" es un error, "(ab)" emite a y b en el mismo frame. Nada espera de verdad.
 */
describe('Marble tests', () => {
  let ts: TestScheduler;
  beforeEach(() => (ts = new TestScheduler((real, esperado) => expect(real).toEqual(esperado))));

  it('switchMap: al llegar un término nuevo, cancela la búsqueda anterior', () => {
    ts.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const terminos = hot('-a-b------|', { a: 'du', b: 'dun' });
      const peticiones: ReturnType<typeof cold>[] = [];
      const resultado = terminos.pipe(
        switchMap((t) => {
          const p = cold('---r|', { r: t.toUpperCase() });
          peticiones.push(p);
          return p;
        }),
      );
      // "du" iba a responder en el frame 4, pero "dun" llegó en el 3: solo queda DUN (frame 6)
      expectObservable(resultado).toBe('------r---|', { r: 'DUN' });
      ts.flush();
      expectSubscriptions(peticiones[0].subscriptions).toBe('-^-!'); // la de "du": cancelada en el 3
      expectSubscriptions(peticiones[1].subscriptions).toBe('---^---!'); // la de "dun": hasta el final
    });
  });

  it('mergeMap no cancela (llegan las dos); concatMap espera a que termine la primera', () => {
    ts.run(({ hot, cold, expectObservable }) => {
      const terminos = hot('-a-b------|', { a: 'du', b: 'dun' });
      const buscarT = (t: string) => cold('---r|', { r: t.toUpperCase() });
      expectObservable(terminos.pipe(mergeMap(buscarT))).toBe('----a-b---|', { a: 'DU', b: 'DUN' });
      expectObservable(terminos.pipe(concatMap(buscarT))).toBe('----a---b-|', {
        a: 'DU',
        b: 'DUN',
      });
    });
  });

  it('el buscador completo: debounce de 3, mínimo 2 letras, sin repetidos y switchMap', () => {
    ts.run(({ hot, cold, expectObservable }) => {
      //                 d u n e (pausa)   x (pausa) dune otra vez
      const teclas = hot('-a-b-c-d------e------f-------|', {
        a: 'd',
        b: 'du',
        c: 'dun',
        d: 'dune',
        e: 'x',
        f: 'dune',
      });
      const resultado = teclas.pipe(
        debounceTime(3),
        filter((t) => t.length >= 2), // "x" no busca
        distinctUntilChanged(), // "dune" otra vez tras "x" filtrado: no se repite
        switchMap((t) => cold('--r|', { r: `resultados de ${t}` })),
      );
      // "dune" llega en el frame 7 → +3 de debounce = 10 → +2 de la API = 12
      expectObservable(resultado).toBe('------------r----------------|', {
        r: 'resultados de dune',
      });
    });
  });
});
