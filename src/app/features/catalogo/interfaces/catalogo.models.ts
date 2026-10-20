// features/catalogo/interfaces/catalogo.models.ts — la forma que devuelve GET /api/v1/libros/ (módulo 33)
export interface Libro {
  id: number;
  titulo: string;
  isbn: string;
  autores: string[];
  publicado: string | null; // ISO 8601 ("1965-08-01"): el formato lo pone el pipe date
  ejemplares_disponibles: number;
}

export interface FiltrosLibro {
  texto: string;
  soloDisponibles: boolean;
}

export const FILTROS_VACIOS: FiltrosLibro = { texto: '', soloDisponibles: false };
