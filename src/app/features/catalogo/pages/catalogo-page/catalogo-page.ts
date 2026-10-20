import { Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { CarritoReservas } from '../../../../core/carrito/carrito-reservas';
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

const CLAVE_FILTRO = 'catalogo.filtro';

function leerFiltroGuardado(): string {
  try {
    return localStorage.getItem(CLAVE_FILTRO) ?? '';
  } catch {
    return ''; // modo privado, cookies bloqueadas…
  }
}

/** Sin acentos y en minúsculas: "garcia" encuentra "García". */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

@Component({
  selector: 'app-catalogo-page',
  imports: [LibroCard, PanelFiltros],
  templateUrl: './catalogo-page.html',
  styleUrl: './catalogo-page.scss',
  host: { '(document:keydown)': 'atajo($event)' },
})
export class CatalogoPage {
  private readonly carrito = inject(CarritoReservas);
  private readonly campo = viewChild.required<ElementRef<HTMLInputElement>>('campo');

  readonly libros = signal<Libro[]>(LIBROS_DE_PRUEBA);
  readonly filtro = signal(leerFiltroGuardado());

  readonly visibles = computed(() => {
    const termino = normalizar(this.filtro().trim());
    if (!termino) return this.libros();
    return this.libros().filter((l) =>
      normalizar(`${l.titulo} ${l.autores.join(' ')}`).includes(termino),
    );
  });
  readonly total = computed(() => this.visibles().length);

  constructor() {
    // Sincronizar con el mundo exterior: eso SÍ es trabajo de un effect
    effect(() => {
      try {
        localStorage.setItem(CLAVE_FILTRO, this.filtro());
      } catch {
        /* sin almacenamiento: no pasa nada */
      }
    });
  }

  protected reservar(id: number): void {
    const libro = this.libros().find((l) => l.id === id);
    if (libro) this.carrito.anadir(libro);
  }

  /** "/" enfoca el buscador (como en GitHub o YouTube), salvo si ya estás escribiendo. */
  protected atajo(evento: KeyboardEvent): void {
    const destino = evento.target; // puede ser el propio document, que no tiene closest()
    const escribiendo =
      destino instanceof Element && destino.closest('input, textarea, select, [contenteditable]');
    if (evento.key === '/' && !escribiendo) {
      evento.preventDefault(); // que la "/" no se escriba en el campo
      this.campo().nativeElement.focus();
    }
  }
}
