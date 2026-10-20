import { HttpClient, HttpContext } from '@angular/common/http';
import { computed, DestroyRef, inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  finalize,
  firstValueFrom,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { Usuario } from '../api/tipos';
import { ErrorApi } from '../http/errores';
import { SIN_AUTH, SIN_AVISO_ERROR } from '../http/contexto';
import { conCerrojo } from './cerrojo';

const sinAuth = () => ({ context: new HttpContext().set(SIN_AUTH, true) });

/**
 * El servidor ha rechazado el refresh (401/403): la sesión ha terminado. Cualquier otro fallo (sin
 * red, un 502/503 durante un deploy, un 429, un timeout) es transitorio: la cookie puede seguir
 * valiendo en el servidor, y no se echa a nadie.
 */
export const esSesionRechazada = (e: unknown) =>
  e instanceof ErrorApi && (e.status === 401 || e.status === 403);

interface MensajeSesion {
  tipo: 'sesion-cerrada';
}

/**
 * Sesión con JWT (módulo 35): el access vive EN MEMORIA (una signal) y caduca a los 10 min;
 * el refresh va en una cookie HttpOnly que el navegador envía solo a /api/v1/auth/.
 *
 * La cookie es UNA por navegador, compartida por todas las pestañas, y cada refresh la rota (y
 * pone la anterior en la blacklist). Por eso el refresh se serializa entre pestañas (cerrojo) y el
 * cierre de sesión se avisa a las demás (BroadcastChannel).
 */
@Service()
export class AuthStore {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _access = signal<string | null>(null);
  readonly access = this._access.asReadonly();
  private readonly _usuario = signal<Usuario | null>(null);
  readonly usuario = this._usuario.asReadonly();
  readonly autenticado = computed(() => this._access() !== null && this._usuario() !== null);
  readonly permisos = computed<ReadonlySet<string>>(() => new Set(this._usuario()?.permisos ?? []));

  private refrescoEnCurso: Observable<string> | null = null;

  /** El mismo canal en todas las pestañas del origen: "he cerrado sesión, cerradla vosotras". */
  private readonly canal =
    typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('auth');

  constructor() {
    if (!this.canal) return;
    this.canal.onmessage = (e: MessageEvent<MensajeSesion>) => {
      if (e.data?.tipo !== 'sesion-cerrada' || this._usuario() === null) return;
      this.limpiar(); // sin llamar al servidor: la otra pestaña ya lo hizo (o el servidor la rechazó)
      void this.router.navigateByUrl('/login');
    };
    inject(DestroyRef).onDestroy(() => this.canal?.close());
  }

  login(email: string, password: string): Observable<Usuario> {
    // el login pinta sus errores (401, 429…) en su pantalla: sin aviso global repetido
    const contexto = sinAuth().context.set(SIN_AVISO_ERROR, true);
    return this.http
      .post<{ access: string }>('/api/v1/auth/login/', { email, password }, { context: contexto })
      .pipe(
        tap((r) => this._access.set(r.access)),
        switchMap(() => this.cargarUsuario()),
      );
  }

  /**
   * Un solo refresh aunque lo pidan varias peticiones a la vez (shareReplay), y uno detrás de
   * otro entre pestañas (cerrojo): la segunda pestaña espera y refresca con la cookie que acaba de
   * dejar la primera, en vez de enviar la que el servidor ya ha puesto en la blacklist.
   */
  refrescar(): Observable<string> {
    this.refrescoEnCurso ??= conCerrojo(
      'auth-refresh',
      this.http.post<{ access: string }>('/api/v1/auth/refresh/', null, sinAuth()),
    ).pipe(
      map((r) => r.access),
      tap({
        next: (a) => this._access.set(a),
        error: (e) => {
          if (esSesionRechazada(e)) this.limpiar();
        },
      }),
      finalize(() => (this.refrescoEnCurso = null)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.refrescoEnCurso;
  }

  /** Al cargar la página: si hay cookie de refresh válida, recupera la sesión. */
  restaurarSesion(): Promise<unknown> {
    return firstValueFrom(
      this.refrescar().pipe(
        switchMap(() => this.cargarUsuario()),
        catchError(() => of(null)),
      ),
    );
  }

  /** El botón "Salir": invalida el refresh en el servidor y cierra la sesión en todas las pestañas. */
  logout(): void {
    this.http.post('/api/v1/auth/logout/', null, sinAuth()).subscribe({ error: () => {} });
    this.limpiar();
    this.avisarOtrasPestanas();
    void this.router.navigateByUrl('/login');
  }

  /**
   * El servidor ha rechazado el refresh (esSesionRechazada): la sesión ha terminado, aquí y en las
   * demás pestañas. SIN POST /auth/logout/: no queda nada que invalidar, y esa petición enviaría la
   * cookie actual, que puede ser la nueva que otra pestaña acaba de recibir (y la mataría).
   */
  sesionCaducada(): void {
    this.limpiar();
    this.avisarOtrasPestanas();
    void this.router.navigateByUrl('/login');
  }

  tienePermiso(permiso: string): boolean {
    return this.permisos().has(permiso); // lee una signal: quien lo llame en un computed reacciona
  }

  /** De momento, un único "rol": personal de la biblioteca (es_personal de /me/). */
  tieneRol(rol: string): boolean {
    return rol === 'bibliotecario' && (this._usuario()?.es_personal ?? false);
  }

  /** Para los tests: una sesión sin pasar por la API. */
  establecerSesion(access: string, usuario: Usuario): void {
    this._access.set(access);
    this._usuario.set(usuario);
  }

  private cargarUsuario(): Observable<Usuario> {
    return this.http.get<Usuario>('/api/v1/auth/me/').pipe(tap((u) => this._usuario.set(u)));
  }

  private limpiar(): void {
    this._access.set(null);
    this._usuario.set(null);
  }

  private avisarOtrasPestanas(): void {
    this.canal?.postMessage({ tipo: 'sesion-cerrada' } satisfies MensajeSesion);
  }
}
