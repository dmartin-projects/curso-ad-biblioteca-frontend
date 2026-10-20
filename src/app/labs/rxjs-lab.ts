import { AsyncSubject, BehaviorSubject, ReplaySubject, Subject } from 'rxjs';

/** Ejercicio 1: cada función devuelve lo que recibió cada suscriptor, para verlo en un test. */
type Log = string[];

export function labSubject(): Log {
  const log: Log = [];
  const s = new Subject<string>();
  s.next('a'); // nadie escucha: se pierde
  s.subscribe((v) => log.push(`A ${v}`));
  s.next('b');
  s.subscribe((v) => log.push(`B ${v}`));
  s.next('c');
  return log;
}

export function labBehaviorSubject(): Log {
  const log: Log = [];
  const s = new BehaviorSubject<string>('inicial');
  s.subscribe((v) => log.push(`A ${v}`)); // recibe el valor actual al instante
  s.next('b');
  s.subscribe((v) => log.push(`B ${v}`)); // recibe 'b' al instante
  s.next('c');
  log.push(`getValue ${s.getValue()}`);
  return log;
}

export function labReplaySubject(): Log {
  const log: Log = [];
  const s = new ReplaySubject<number>(2);
  s.next(1);
  s.subscribe((v) => log.push(`A ${v}`)); // A 1 (historial)
  s.next(2);
  s.next(3);
  s.subscribe((v) => log.push(`B ${v}`)); // B 2, B 3 (los 2 últimos)
  return log;
}

export function labAsyncSubject(): Log {
  const log: Log = [];
  const s = new AsyncSubject<number>();
  s.subscribe((v) => log.push(`A ${v}`));
  s.next(1);
  s.next(2);
  log.push('(sin completar: nada)');
  s.complete(); // A 2
  s.subscribe((v) => log.push(`B ${v}`)); // B 2 al instante
  return log;
}
