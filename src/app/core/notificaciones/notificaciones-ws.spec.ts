import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { USUARIO_DE_PRUEBA } from '../../testing/sesion';
import { AuthStore } from '../auth/auth-store';
import { authInterceptor } from '../auth/auth.interceptor';
import { APP_CONFIG } from '../config';
import { NotificacionesWs, urlWebSocket } from './notificaciones-ws';

/** Un WebSocket falso: solo apunta a qué URL se conecta. */
class WebSocketFalso {
  static urls: string[] = [];
  readyState = 0;
  constructor(readonly url: string) {
    WebSocketFalso.urls.push(url);
  }
  send(): void {}
  close(): void {}
}

describe('NotificacionesWs', () => {
  beforeEach(() => {
    WebSocketFalso.urls = [];
    vi.stubGlobal('WebSocket', WebSocketFalso);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('urlWebSocket: la ruta relativa se completa con el host y el protocolo de la página', () => {
    expect(urlWebSocket('/ws/notificaciones/')).toBe(`ws://${location.host}/ws/notificaciones/`);
  });

  it('pide un ticket (con el access, por los interceptors) y conecta con él: el JWT no va en la URL', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: APP_CONFIG,
          useValue: { apiUrl: '/api/v1', wsUrl: '/ws', paginaPorDefecto: 20 },
        },
      ],
    });
    TestBed.inject(AuthStore).establecerSesion('secreto', USUARIO_DE_PRUEBA);
    const ctrl = TestBed.inject(HttpTestingController);

    const sub = TestBed.inject(NotificacionesWs).mensajes$.subscribe();
    expect(WebSocketFalso.urls).toEqual([]); // primero el ticket
    const ticket = ctrl.expectOne('/api/v1/notificaciones/ws-ticket/');
    expect(ticket.request.method).toBe('POST');
    expect(ticket.request.headers.get('Authorization')).toBe('Bearer secreto');
    ticket.flush({ ticket: 'un-solo-uso' });

    expect(WebSocketFalso.urls).toEqual([
      `ws://${location.host}/ws/notificaciones/?ticket=un-solo-uso`,
    ]);
    expect(WebSocketFalso.urls[0]).not.toContain('secreto');
    sub.unsubscribe();
  });
});
