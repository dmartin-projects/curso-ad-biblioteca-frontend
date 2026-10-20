import { Service } from '@angular/core';
import { defer, delay, Observable, of } from 'rxjs';
import { GastoSimple } from './eventos-gastos';

/** API simulada (módulo 51 la cambia por HttpClient). Cuenta las llamadas para los tests. */
@Service()
export class GastosApiFalsa {
  private datos: GastoSimple[] = [{ id: 1, concepto: 'Mercadona' }];
  llamadasListar = 0;
  llamadasCrear = 0;

  listar(): Observable<GastoSimple[]> {
    return defer(() => {
      this.llamadasListar++;
      return of([...this.datos]).pipe(delay(50));
    });
  }

  crear(concepto: string): Observable<GastoSimple> {
    return defer(() => {
      this.llamadasCrear++;
      const g = { id: this.datos.length + 1, concepto };
      this.datos = [...this.datos, g];
      return of(g).pipe(delay(300)); // un guardado "lento" para poder hacer doble clic
    });
  }
}
