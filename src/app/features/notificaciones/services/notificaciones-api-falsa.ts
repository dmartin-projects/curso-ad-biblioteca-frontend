import { Service } from '@angular/core';
import { defer, delay, Observable, of, throwError } from 'rxjs';
import { Notificacion } from '../interfaces/notificaciones.models';

/** API simulada. `fallar = true` hace que marcarLeida devuelva un error. */
@Service()
export class NotificacionesApiFalsa {
  fallar = false;
  private datos: Notificacion[] = [
    { id: 1, texto: 'Dune vence mañana', leida: false },
    { id: 2, texto: 'Ya puedes recoger Fundación', leida: false },
  ];

  listar(): Observable<Notificacion[]> {
    return defer(() => of(this.datos.map((n) => ({ ...n }))).pipe(delay(20)));
  }

  marcarLeida(id: number): Observable<void> {
    return defer(() => {
      if (this.fallar) return throwError(() => new Error('503')).pipe(delay(20));
      this.datos = this.datos.map((n) => (n.id === id ? { ...n, leida: true } : n));
      return of(undefined).pipe(delay(20));
    });
  }
}
