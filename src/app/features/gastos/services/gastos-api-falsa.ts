import { Service } from '@angular/core';
import { defer, delay, Observable, of } from 'rxjs';
import { GastoSimple } from './eventos-gastos';

/** API simulada (módulo 51 la cambia por HttpClient). Cuenta las llamadas para los tests. */
@Service()
export class GastosApiFalsa {
  private datos: GastoSimple[] = [
    { id: 1, concepto: 'Mercadona', hogar: 1 },
    { id: 2, concepto: 'Chiringuito', hogar: 2 },
  ];
  llamadasListar = 0;
  llamadasCrear = 0;

  /** Los gastos de un hogar (módulo 54); sin hogar, los del primero. */
  listar(hogar = 1): Observable<GastoSimple[]> {
    return defer(() => {
      this.llamadasListar++;
      return of(this.datos.filter((g) => g.hogar === hogar)).pipe(delay(50));
    });
  }

  crear(concepto: string, hogar = 1): Observable<GastoSimple> {
    return defer(() => {
      this.llamadasCrear++;
      const g = { id: this.datos.length + 1, concepto, hogar };
      this.datos = [...this.datos, g];
      return of(g).pipe(delay(300)); // un guardado "lento" para poder hacer doble clic
    });
  }
}
