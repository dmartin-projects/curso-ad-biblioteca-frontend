import { Component, computed, effect, inject, linkedSignal, signal } from '@angular/core';
import { RequierePermiso } from '../../../../core/auth/permisos/requiere-permiso';
import { SiPermiso } from '../../../../core/auth/permisos/si-permiso';
import { BotonMenu } from '../../../../shared/components/boton-menu/boton-menu';
import { Lista } from '../../../../shared/components/lista/lista';
import { AltaLibro } from '../../components/alta-libro/alta-libro';
import { Paginador } from '../../../../shared/components/paginador/paginador';
import { CarritoReservas } from '../../../../core/carrito/carrito-reservas';
import { FILTROS_VACIOS, FiltrosLibro, Libro } from '../../interfaces/catalogo.models';
import { LIBROS_DE_PRUEBA } from '../../services/datos-prueba';
import { FiltrosLibros } from '../../components/filtros-libros/filtros-libros';
import { ListaLibros } from '../../components/lista-libros/lista-libros';

const CLAVE_FILTROS = 'catalogo.filtros';

function leerFiltros(): FiltrosLibro {
  try {
    return { ...FILTROS_VACIOS, ...JSON.parse(localStorage.getItem(CLAVE_FILTROS) ?? '{}') };
  } catch {
    return FILTROS_VACIOS; // modo privado, JSON corrupto…
  }
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** Contenedor: tiene el estado, decide qué hacer con los eventos. Casi sin HTML. */
@Component({
  selector: 'app-catalogo-page',
  imports: [
    FiltrosLibros,
    ListaLibros,
    Paginador,
    Lista,
    SiPermiso,
    RequierePermiso,
    BotonMenu,
    AltaLibro,
  ],
  templateUrl: './catalogo-page.html',
})
export class CatalogoPage {
  private readonly carrito = inject(CarritoReservas);
  protected readonly tamano = 2; // pequeño para ver la paginación con 5 libros de prueba
  protected readonly porId = (libro: Libro) => libro.id;

  readonly libros = signal<Libro[]>(LIBROS_DE_PRUEBA); // en el módulo 51, un httpResource
  readonly filtros = signal<FiltrosLibro>(leerFiltros());
  readonly compacta = signal(false);
  readonly alta = signal(false);
  /** Vuelve a 1 cada vez que cambian los filtros (módulo 41). */
  readonly pagina = linkedSignal({ source: this.filtros, computation: () => 1 });

  readonly visibles = computed(() => {
    const { texto, soloDisponibles } = this.filtros();
    const termino = normalizar(texto.trim());
    return this.libros().filter(
      (l) =>
        (!soloDisponibles || l.ejemplares_disponibles > 0) &&
        (!termino || normalizar(`${l.titulo} ${l.autores.join(' ')}`).includes(termino)),
    );
  });
  readonly total = computed(() => this.visibles().length);
  protected readonly pagina_ = computed(() => {
    const inicio = (this.pagina() - 1) * this.tamano;
    return this.visibles().slice(inicio, inicio + this.tamano);
  });

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(CLAVE_FILTROS, JSON.stringify(this.filtros()));
      } catch {
        /* sin almacenamiento: no pasa nada */
      }
    });
  }

  protected reservar(id: number): void {
    const libro = this.libros().find((l) => l.id === id);
    if (libro) this.carrito.anadir(libro);
  }
}
