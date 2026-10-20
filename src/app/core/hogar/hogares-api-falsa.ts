import { Service } from '@angular/core';
import { defer, delay, Observable, of } from 'rxjs';

export interface Hogar {
  id: number;
  nombre: string;
  mi_rol: 'admin' | 'miembro';
}

/** Hasta el proyecto final (módulo 72), los hogares viven en memoria. */
@Service()
export class HogaresApiFalsa {
  private datos: Hogar[] = [
    { id: 1, nombre: 'Casa', mi_rol: 'admin' },
    { id: 2, nombre: 'Piso de la playa', mi_rol: 'miembro' },
  ];

  listar(): Observable<Hogar[]> {
    return defer(() => of(this.datos.map((h) => ({ ...h }))).pipe(delay(30)));
  }

  crear(datos: { nombre: string }): Observable<Hogar> {
    return defer(() => {
      const h: Hogar = {
        id: Math.max(...this.datos.map((x) => x.id)) + 1,
        nombre: datos.nombre,
        mi_rol: 'admin',
      };
      this.datos = [...this.datos, h];
      return of(h).pipe(delay(30));
    });
  }
}
