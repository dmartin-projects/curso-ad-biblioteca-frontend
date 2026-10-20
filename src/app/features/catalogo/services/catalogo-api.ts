import { HttpClient, HttpEventType, HttpParams, httpResource } from '@angular/common/http';
import { inject, Service, Signal } from '@angular/core';
import { filter, map, Observable } from 'rxjs';
import { LibroDetalle, LibroEscritura, LibroLista, Paginado } from '../../../core/api/tipos';
import { APP_CONFIG } from '../../../core/config';
import { EstadoSubida } from '../interfaces/catalogo.models';

export interface ConsultaLibros {
  search?: string;
  disponible?: boolean;
  genero?: number[];
  ordering?: string;
  page?: number;
  page_size?: number;
}

@Service()
export class CatalogoApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(APP_CONFIG).apiUrl; // '/api/v1' (módulo 45)

  // ── Lectura reactiva: recursos ──
  librosResource(consulta: Signal<ConsultaLibros>) {
    return httpResource<Paginado<LibroLista>>(() => ({
      url: `${this.base}/libros/`,
      params: aParams({ ...consulta() }),
    }));
  }

  libroResource(id: Signal<number | undefined>) {
    return httpResource<LibroDetalle>(() => (id() ? `${this.base}/libros/${id()}/` : undefined));
  }

  /** Solo el título de un libro (para el título de la pestaña). */
  titulo(id: number): Observable<string> {
    return this.http
      .get<{ titulo: string }>(`${this.base}/libros/${id}/`)
      .pipe(map((l) => l.titulo));
  }

  // ── Acciones: Observables ──
  crearLibro(datos: LibroEscritura): Observable<LibroDetalle> {
    return this.http.post<LibroDetalle>(`${this.base}/libros/`, datos);
  }

  actualizarLibro(id: number, cambios: Partial<LibroEscritura>): Observable<LibroDetalle> {
    return this.http.patch<LibroDetalle>(`${this.base}/libros/${id}/`, cambios);
  }

  borrarLibro(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/libros/${id}/`);
  }

  /**
   * PUT multipart con eventos de progreso (necesita withXhr() en app.config). Traduce los
   * HttpEvent a un EstadoSubida: quien la usa no necesita saber nada de HTTP.
   */
  subirPortada(id: number, archivo: File): Observable<EstadoSubida> {
    const datos = new FormData();
    datos.append('portada', archivo); // sin Content-Type a mano: lo pone el navegador con el boundary
    return this.http
      .put<{ portada: string }>(`${this.base}/libros/${id}/portada/`, datos, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        map((ev): EstadoSubida | null => {
          if (ev.type === HttpEventType.UploadProgress && ev.total) {
            return { tipo: 'progreso', porcentaje: Math.round((100 * ev.loaded) / ev.total) };
          }
          if (ev.type === HttpEventType.Response)
            return { tipo: 'hecha', portada: ev.body!.portada };
          return null; // el resto de eventos (Sent, cabeceras…) no interesan
        }),
        filter((estado) => estado !== null),
      );
  }
}

/** Quita vacíos y convierte arrays en parámetros repetidos (?genero=1&genero=2), como espera django-filter. */
export function aParams(obj: Record<string, unknown>): HttpParams {
  let p = new HttpParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '' || v === false) continue;
    for (const item of Array.isArray(v) ? v : [v]) p = p.append(k, String(item));
  }
  return p;
}
