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

  borrar(id: number): Observable<void> {
    return defer(() => {
      this.datos = this.datos.filter((g) => g.id !== id);
      return of(undefined).pipe(delay(30));
    });
  }

  /** Categorías y su orden (ejercicio 5 del módulo 55). */
  private orden = [1, 2, 3];
  readonly ordenesGuardados: number[][] = [];
  guardarOrden(ids: number[]): Observable<void> {
    return defer(() => {
      this.orden = [...ids];
      this.ordenesGuardados.push([...ids]);
      return of(undefined).pipe(delay(30));
    });
  }
  ordenCategorias(): number[] {
    return [...this.orden];
  }

  crear(concepto: string, hogar = 1): Observable<GastoSimple> {
    return defer(() => {
      this.llamadasCrear++;
      const g = { id: Math.max(0, ...this.datos.map((x) => x.id)) + 1, concepto, hogar };
      this.datos = [...this.datos, g];
      return of(g).pipe(delay(300)); // un guardado "lento" para poder hacer doble clic
    });
  }
}
