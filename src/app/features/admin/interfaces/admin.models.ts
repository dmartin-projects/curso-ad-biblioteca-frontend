import type { Prestamo } from '../../../core/api/tipos';

export type { Prestamo };

/** Los filtros del panel de préstamos del personal. */
export type FiltroPrestamos = 'activos' | 'vencidos' | 'todos';

/** Una fila del gráfico de la administración: cuántos libros tiene un género. */
export interface LibrosPorGenero {
  genero: string;
  libros: number;
}
