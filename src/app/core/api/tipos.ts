// Tipos generados desde el esquema OpenAPI de Django: `npm run api:tipos`
import type { components } from './schema';

type S = components['schemas'];
export type LibroLista = S['LibroLista'];
export type LibroDetalle = S['Libro'];
export type LibroEscritura = S['LibroRequest'];
export type Autor = S['Autor'];
export type Prestamo = S['Prestamo'];
export type Usuario = S['Usuario'];
export type Problema = S['Problema']; // el formato de error del módulo 38

export interface Paginado<T> {
  count: number;
  total_pages: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
