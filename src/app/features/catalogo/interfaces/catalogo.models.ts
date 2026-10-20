// features/catalogo/interfaces/catalogo.models.ts — desde el módulo 51, los tipos salen del esquema OpenAPI
import type { Autor, LibroDetalle, LibroLista } from '../../../core/api/tipos';

/** Un libro tal como llega en los listados (GET /api/v1/libros/). */
export type Libro = LibroLista;
export type { Autor, LibroDetalle };

export interface FiltrosLibro {
  texto: string;
  soloDisponibles: boolean;
}

export const FILTROS_VACIOS: FiltrosLibro = { texto: '', soloDisponibles: false };

/** Cómo va una subida de portada: el % enviado y, al terminar, la URL de la portada nueva. */
export type EstadoSubida =
  { tipo: 'progreso'; porcentaje: number } | { tipo: 'hecha'; portada: string };
