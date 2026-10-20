import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import type { components } from '../api/schema';
import { Prestamo } from '../api/tipos';

export type PaginaPrestamos = components['schemas']['PaginatedPrestamoList'];
export type EstadoPrestamo = Prestamo['estado'];

export interface ConsultaPrestamos {
  estado?: EstadoPrestamo | ''; // 'activo' | 'devuelto': "vencido" NO es un estado (módulo 14)
  vencidos?: boolean; // activos con la fecha límite pasada: GET /prestamos/vencidos/
  cursor?: string | null;
}

/** Los préstamos usan paginación por CURSOR (módulo 37): next/previous, sin números de página. */
@Service()
export class PrestamosApi {
  private readonly http = inject(HttpClient);

  listar(c: ConsultaPrestamos): Observable<PaginaPrestamos> {
    const params: Record<string, string> = {};
    if (c.estado) params['estado'] = c.estado;
    if (c.cursor) params['cursor'] = c.cursor;
    const url = c.vencidos ? '/api/v1/prestamos/vencidos/' : '/api/v1/prestamos/';
    return this.http.get<PaginaPrestamos>(url, { params });
  }

  /** Una página a partir de la URL "next" de la anterior (paginación por cursor). */
  pagina(url: string): Observable<PaginaPrestamos> {
    return this.http.get<PaginaPrestamos>(url);
  }

  devolver(id: number): Observable<Prestamo> {
    return this.http.post<Prestamo>(`/api/v1/prestamos/${id}/devolver/`, null);
  }
}

/** Saca el cursor de la URL "next"/"previous" que devuelve DRF. */
export function cursorDe(url: string | null | undefined): string | null {
  return url ? new URL(url, 'http://x').searchParams.get('cursor') : null;
}

/**
 * DRF devuelve "next" ABSOLUTA (http://localhost:4200/api/v1/prestamos/?cursor=…). Los interceptores
 * solo tratan las URL que empiezan por /api/: con la absoluta, la petición saldría SIN token.
 */
export function relativa(url: string | null | undefined): string | null {
  if (!url) return null;
  const u = new URL(url, location.origin);
  return u.pathname + u.search;
}
