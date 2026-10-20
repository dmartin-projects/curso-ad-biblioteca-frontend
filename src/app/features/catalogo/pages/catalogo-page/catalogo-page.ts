import { Component, signal } from '@angular/core';
import { Libro } from '../../interfaces/catalogo.models';
import { LibroCard } from '../../components/libro-card/libro-card';
import { PanelFiltros } from '../../components/panel-filtros/panel-filtros';

const LIBROS_DE_PRUEBA: Libro[] = [
  {
    id: 1,
    titulo: 'Dune',
    isbn: '9780441172719',
    autores: ['Frank Herbert'],
    publicado: '1965-08-01',
    ejemplares_disponibles: 2,
  },
  {
    id: 2,
    titulo: 'Cien años de soledad',
    isbn: '9788497592208',
    autores: ['Gabriel García Márquez'],
    publicado: '1967-05-30',
    ejemplares_disponibles: 0,
  },
  {
    id: 3,
    titulo: 'Hijos de Dune',
    isbn: '9788497593793',
    autores: ['Frank Herbert'],
    publicado: '1976-01-01',
    ejemplares_disponibles: 1,
  },
];

@Component({
  selector: 'app-catalogo-page',
  imports: [LibroCard, PanelFiltros],
  templateUrl: './catalogo-page.html',
  styleUrl: './catalogo-page.scss',
})
export class CatalogoPage {
  protected readonly libros = signal<Libro[]>(LIBROS_DE_PRUEBA);
  protected readonly reservado = signal<number | null>(null);

  protected reservar(id: number): void {
    this.reservado.set(id);
  }
}
