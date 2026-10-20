import { Service } from '@angular/core';
import { defer, delay, Observable, of, throwError } from 'rxjs';

const AUTORES = [
  'Frank Herbert',
  'Gabriel García Márquez',
  'Ursula K. Le Guin',
  'Isaac Asimov',
  'Isabel Allende',
];

/** Hasta el módulo 51 (HttpClient), una API simulada con latencia. 'error' provoca un fallo. */
@Service()
export class AutoresApiFalsa {
  llamadas = 0;

  buscar(termino: string, latenciaMs = 200): Observable<string[]> {
    return defer(() => {
      this.llamadas++;
      if (termino === 'error') return throwError(() => new Error('500'));
      const t = termino.toLowerCase();
      return of(AUTORES.filter((a) => a.toLowerCase().includes(t))).pipe(delay(latenciaMs));
    });
  }
}
