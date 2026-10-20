import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { Notificacion } from '../../interfaces/notificaciones.models';
import { NotificacionesApiFalsa } from '../../services/notificaciones-api-falsa';

@Component({
  selector: 'app-notificaciones',
  templateUrl: './notificaciones.html',
})
export class Notificaciones {
  private readonly api = inject(NotificacionesApiFalsa);

  readonly notificaciones = rxResource({
    stream: () => this.api.listar(),
    defaultValue: [] as Notificacion[],
  });

  async marcarLeida(n: Notificacion): Promise<void> {
    // 1) optimista: la UI cambia YA (estado 'local')
    this.notificaciones.update((lista) =>
      lista.map((x) => (x.id === n.id ? { ...x, leida: true } : x)),
    );
    try {
      await firstValueFrom(this.api.marcarLeida(n.id));
    } catch {
      this.notificaciones.reload(); // 2) si falla, vuelve a la verdad del servidor
    }
  }
}
