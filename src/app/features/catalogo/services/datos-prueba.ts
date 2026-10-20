// Datos fijos para los tests (desde el módulo 51 la app usa la API)
import { Libro } from '../interfaces/catalogo.models';

export const LIBROS_DE_PRUEBA: Libro[] = [
  {
    id: 1,
    titulo: 'Dune',
    isbn: '9780441172719',
    autores: ['Frank Herbert'],
    publicado: '1965-08-01',
    generos: [],
    ejemplares_disponibles: 2,
  },
  {
    id: 2,
    titulo: 'Cien años de soledad',
    isbn: '9788497592208',
    autores: ['Gabriel García Márquez'],
    publicado: '1967-05-30',
    generos: [],
    ejemplares_disponibles: 0,
  },
  {
    id: 3,
    titulo: 'Hijos de Dune',
    isbn: '9788497593793',
    autores: ['Frank Herbert'],
    publicado: '1976-01-01',
    generos: [],
    ejemplares_disponibles: 1,
  },
  {
    id: 4,
    titulo: 'La mano izquierda de la oscuridad',
    isbn: '9788445076699',
    autores: ['Ursula K. Le Guin'],
    publicado: '1969-03-01',
    generos: [],
    ejemplares_disponibles: 3,
  },
  {
    id: 5,
    titulo: 'Fundación',
    isbn: '9788497593069',
    autores: ['Isaac Asimov'],
    publicado: '1951-06-01',
    generos: [],
    ejemplares_disponibles: 1,
  },
];
