import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import type { components } from '../api/schema';
import { Prestamo } from '../api/tipos';

export type PaginaPrestamos = components['schemas']['PaginatedPrestamoList'];
export type EstadoPrestamo = Prestamo['estado'];

export interface ConsultaPrestamos {
  estado?: EstadoPrestamo | '';
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
    return this.http.get<PaginaPrestamos>('/api/v1/prestamos/', { params });
  }

  devolver(id: number): Observable<Prestamo> {
    return this.http.post<Prestamo>(`/api/v1/prestamos/${id}/devolver/`, null);
  }
}

/** Saca el cursor de la URL "next"/"previous" que devuelve DRF. */
export function cursorDe(url: string | null | undefined): string | null {
  return url ? new URL(url, 'http://x').searchParams.get('cursor') : null;
}
