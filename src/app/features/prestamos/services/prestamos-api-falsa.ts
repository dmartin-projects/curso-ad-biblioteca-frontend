import { Service } from '@angular/core';
import { defer, delay, Observable, of } from 'rxjs';
import { PrestamoResumen } from '../interfaces/prestamos.models';

export interface Paginado<T> {
  count: number;
  results: T[];
}
export interface ConsultaPrestamos {
  estado: 'activo' | 'devuelto' | '';
  pagina: number;
}

const TODOS: PrestamoResumen[] = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  libro: { id: i + 1, titulo: `Libro ${i + 1}` },
  fecha_limite: '2026-11-15T10:00:00Z',
  estado: i < 3 ? 'activo' : 'devuelto',
}));

/** Simula GET /api/v1/prestamos/?estado=&page= (página de 2). Registra las consultas. */
@Service()
export class PrestamosApiFalsa {
  readonly consultas: ConsultaPrestamos[] = [];

  listar(c: ConsultaPrestamos): Observable<Paginado<PrestamoResumen>> {
    return defer(() => {
      this.consultas.push(c);
      const filtrados = TODOS.filter((p) => !c.estado || p.estado === c.estado);
      const results = filtrados.slice((c.pagina - 1) * 2, c.pagina * 2);
      return of({ count: filtrados.length, results }).pipe(delay(20));
    });
  }
}
