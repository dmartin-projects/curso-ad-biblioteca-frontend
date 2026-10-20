import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { defer, Observable, repeat, retry, share, switchMap, timer } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { APP_CONFIG } from '../config';
import { SIN_AVISO_ERROR } from '../http/contexto';

export type MensajeWs =
  | { tipo: 'conectado' | 'pong' }
  | { tipo: 'notificacion'; datos: { evento: string; mensaje: string; [k: string]: unknown } };

/** '/ws/…' → 'ws://host/ws/…' (o 'wss://' si la página va por https). Se llama AL CONECTAR. */
export function urlWebSocket(ruta: string): string {
  const url = new URL(ruta, location.href);
  url.protocol = url.protocol.replace('http', 'ws');
  return url.href;
}

@Service()
export class NotificacionesWs {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private socket?: WebSocketSubject<MensajeWs>;

  /**
   * Flujo de mensajes con reconexión automática. Cada conexión empieza pidiendo un ticket de un
   * solo uso: el JWT nunca va en la URL (acabaría en los logs de nginx y de Daphne). El POST pasa
   * por los interceptors, así que, si el access ha caducado, se refresca antes de conectar.
   */
  readonly mensajes$: Observable<MensajeWs> = defer(() =>
    this.http.post<{ ticket: string }>(`${this.config.apiUrl}/notificaciones/ws-ticket/`, null, {
      context: new HttpContext().set(SIN_AVISO_ERROR, true), // va en segundo plano: sin avisos
    }),
  ).pipe(
    switchMap(({ ticket }) => {
      this.socket = webSocket<MensajeWs>(
        urlWebSocket(`${this.config.wsUrl}/notificaciones/?ticket=${ticket}`),
      );
      return this.socket;
    }),
    // el servidor cerró limpiamente (4401: sin usuario, p. ej. ticket caducado): otro ticket
    repeat({ delay: () => timer(1_000) }),
    // se cayó la conexión o falló el ticket: reintento con espera creciente (2 s, 4 s… hasta 30 s)
    retry({
      delay: (_e, intento) => timer(Math.min(30_000, 1000 * 2 ** intento)),
      resetOnSuccess: true,
    }),
    share(), // una conexión para todos los suscriptores
  );

  enviar(m: unknown): void {
    this.socket?.next(m as MensajeWs);
  }
}
