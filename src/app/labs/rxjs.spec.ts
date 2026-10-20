import {
  BehaviorSubject,
  concatMap,
  delay,
  map,
  mergeMap,
  of,
  Subject,
  switchMap,
  timer,
} from 'rxjs';
import { autocompletar, guardarSinDobles, listadoCombinado } from '../shared/utils/flujos';
import { labAsyncSubject, labBehaviorSubject, labReplaySubject, labSubject } from './rxjs-lab';

describe('1. Los cuatro Subjects', () => {
  it('Subject: solo lo futuro', () => {
    expect(labSubject()).toEqual(['A b', 'A c', 'B c']);
  });
  it('BehaviorSubject: el valor actual al suscribirse', () => {
    expect(labBehaviorSubject()).toEqual(['A inicial', 'A b', 'B b', 'A c', 'B c', 'getValue c']);
  });
  it('ReplaySubject(2): los 2 últimos', () => {
    expect(labReplaySubject()).toEqual(['A 1', 'A 2', 'A 3', 'B 2', 'B 3']);
  });
  it('AsyncSubject: el último, solo al completar', () => {
    expect(labAsyncSubject()).toEqual(['(sin completar: nada)', 'A 2', 'B 2']);
  });
});

describe('flujos con tiempo (fake timers)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('2. autocompletar: debounce, mínimo 2 letras, distinct y error controlado', () => {
    const llamadas: string[] = [];
    const errores: unknown[] = [];
    const termino$ = new Subject<string>();
    const recibido: string[][] = [];
    termino$
      .pipe(
        autocompletar(
          (t) => {
            llamadas.push(t);
            return t === 'error'
              ? timer(10).pipe(
                  map(() => {
                    throw new Error('500');
                  }),
                )
              : of([t.toUpperCase()]).pipe(delay(100));
          },
          (e) => errores.push(e),
        ),
      )
      .subscribe((r) => recibido.push(r));

    termino$.next('d');
    termino$.next('du');
    termino$.next('dun'); // solo este pasa el debounce
    vi.advanceTimersByTime(300);
    expect(llamadas).toEqual(['dun']);
    termino$.next('dun '); // trim → igual que el anterior: distinctUntilChanged lo descarta
    vi.advanceTimersByTime(400);
    expect(llamadas).toEqual(['dun']);
    expect(recibido).toEqual([['DUN']]);

    termino$.next('error');
    vi.advanceTimersByTime(400);
    expect(errores).toHaveLength(1);
    expect(recibido.at(-1)).toEqual([]); // valor de sustitución

    termino$.next('dune'); // el flujo SIGUE VIVO tras el error
    vi.advanceTimersByTime(400);
    expect(recibido.at(-1)).toEqual(['DUNE']);

    termino$.next('x'); // menos de 2 letras → lista vacía sin llamar a la API
    vi.advanceTimersByTime(300);
    expect(recibido.at(-1)).toEqual([]);
    expect(llamadas).toEqual(['dun', 'error', 'dune']);
  });

  // "dun" tarda 200 ms; "dune" se escribe a los 100 ms y tarda 50 ms
  const LATENCIA: Record<string, number> = { dun: 200, dune: 50 };
  const buscar = (t: string) => of(t).pipe(delay(LATENCIA[t]));
  const OPERADORES = { mergeMap, switchMap, concatMap };
  function ejecutar(nombre: keyof typeof OPERADORES) {
    const aplanar = OPERADORES[nombre] as typeof switchMap; // los tres tienen la misma firma
    const termino$ = new Subject<string>();
    const recibido: string[] = [];
    termino$.pipe(aplanar(buscar)).subscribe((r) => recibido.push(r));
    termino$.next('dun');
    vi.advanceTimersByTime(100);
    termino$.next('dune');
    vi.advanceTimersByTime(500);
    return recibido;
  }

  it('3. respuestas desordenadas: mergeMap acaba mostrando "dun"', () => {
    expect(ejecutar('mergeMap')).toEqual(['dune', 'dun']); // ❌ lo último pintado es lo viejo
  });
  it('3. switchMap cancela "dun"', () => {
    expect(ejecutar('switchMap')).toEqual(['dune']); // ✅
  });
  it('3. concatMap respeta el orden (pero espera a "dun")', () => {
    expect(ejecutar('concatMap')).toEqual(['dun', 'dune']);
  });

  it('3. con latencias aleatorias, switchMap siempre termina en el último término', () => {
    for (let ronda = 0; ronda < 20; ronda++) {
      const termino$ = new Subject<string>();
      const recibido: string[] = [];
      termino$
        .pipe(switchMap((t) => of(t).pipe(delay(Math.random() * 300))))
        .subscribe((r) => recibido.push(r));
      for (const t of ['d', 'du', 'dun', 'dune']) {
        termino$.next(t);
        vi.advanceTimersByTime(Math.random() * 100);
      }
      vi.advanceTimersByTime(1000);
      expect(recibido.at(-1)).toBe('dune');
    }
  });

  it('4. exhaustMap: tres clics seguidos = un guardado', () => {
    let guardados = 0;
    const clics$ = new Subject<void>();
    const resultados: number[] = [];
    clics$
      .pipe(guardarSinDobles(() => timer(300).pipe(map(() => ++guardados))))
      .subscribe((r) => resultados.push(r));
    clics$.next();
    clics$.next(); // ignorado: hay uno en curso
    vi.advanceTimersByTime(100);
    clics$.next(); // ignorado
    vi.advanceTimersByTime(300);
    expect(resultados).toEqual([1]);
    clics$.next(); // ya terminó: este sí
    vi.advanceTimersByTime(300);
    expect(resultados).toEqual([1, 2]);
  });

  it('5. combineLatest + switchMap: cualquier cambio recarga y cancela la anterior', () => {
    const filtros$ = new BehaviorSubject({ texto: '' });
    const pagina$ = new BehaviorSubject(1);
    const orden$ = new BehaviorSubject('-fecha');
    const peticiones: string[] = [];
    const recibido: string[] = [];
    listadoCombinado(filtros$, pagina$, orden$, (c) => {
      const clave = `${c.filtros.texto}|${c.pagina}|${c.orden}`;
      peticiones.push(clave);
      return of(clave).pipe(delay(100));
    }).subscribe((r) => recibido.push(r));

    vi.advanceTimersByTime(100);
    pagina$.next(2);
    orden$.next('importe'); // llega antes de que responda la de la página 2
    vi.advanceTimersByTime(100);
    expect(peticiones).toEqual(['|1|-fecha', '|2|-fecha', '|2|importe']);
    expect(recibido).toEqual(['|1|-fecha', '|2|importe']); // la de '|2|-fecha' se canceló
  });
});
