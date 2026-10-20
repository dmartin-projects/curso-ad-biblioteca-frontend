import {
  Component,
  computed,
  inject,
  injectAsync,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { RequierePermiso } from '../../../../core/auth/permisos/requiere-permiso';
import { SiPermiso } from '../../../../core/auth/permisos/si-permiso';
import { BotonMenu } from '../../../../shared/components/boton-menu/boton-menu';
import { Lista } from '../../../../shared/components/lista/lista';
import { Paginador } from '../../../../shared/components/paginador/paginador';
import { CarritoReservas } from '../../../../core/carrito/carrito-reservas';
import { CONFIG_CATALOGO } from '../../catalogo.config';
import { FiltrosLibro, Libro } from '../../interfaces/catalogo.models';
import { LIBROS_DE_PRUEBA } from '../../services/datos-prueba';
import { FiltrosLibros } from '../../components/filtros-libros/filtros-libros';
import { ListaLibros } from '../../components/lista-libros/lista-libros';

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Contenedor. Filtros y página viven en la URL (?search=dune&disponibles=true&page=2):
 * se puede recargar, compartir el enlace o volver atrás sin perderlos.
 */
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
    RouterLink,
  ],
  templateUrl: './catalogo-page.html',
  styleUrl: './catalogo-page.scss',
})
export default class CatalogoPage {
  private readonly router = inject(Router);
  private readonly carrito = inject(CarritoReservas);
  private readonly config = inject(CONFIG_CATALOGO);
  /** El chunk del exportador solo se descarga la primera vez que se pulsa "Exportar". */
  private readonly exportador = injectAsync(() =>
    import('../../services/exportador-csv').then((m) => m.ExportadorCsv),
  );
  protected readonly tamano = this.config.tamanoPagina;
  protected readonly porId = (libro: Libro) => libro.id;

  // ── query params como inputs (withComponentInputBinding). Si faltan en la URL, el router
  //    pone undefined: el valor por defecto va en el transform, no en el primer argumento.
  readonly search = input('', { transform: (v: string | undefined) => v ?? '' });
  // solo ?disponibles=true activa el filtro: booleanAttribute('') y booleanAttribute('0') son true
  readonly disponibles = input(false, { transform: (v: unknown) => v === 'true' || v === true });
  readonly page = input(1, { transform: (v: unknown) => numberAttribute(v, 1) });

  readonly libros = signal<Libro[]>(LIBROS_DE_PRUEBA); // en el módulo 51, un httpResource
  readonly compacta = signal(false);
  readonly filtros = computed<FiltrosLibro>(() => ({
    texto: this.search(),
    soloDisponibles: this.disponibles(),
  }));

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
    const inicio = (this.page() - 1) * this.tamano;
    return this.visibles().slice(inicio, inicio + this.tamano);
  });

  /** Cambiar filtros = navegar. page: null la quita de la URL (vuelve a la 1). */
  cambiarFiltros(f: FiltrosLibro): void {
    this.router.navigate([], {
      queryParams: { search: f.texto || null, disponibles: f.soloDisponibles || null, page: null },
      queryParamsHandling: 'merge',
      replaceUrl: true, // escribir no debe llenar el historial de entradas
    });
  }

  irA(pagina: number): void {
    this.router.navigate([], {
      queryParams: { page: pagina > 1 ? pagina : null },
      queryParamsHandling: 'merge',
    });
  }

  async exportar(): Promise<void> {
    const exportador = await this.exportador();
    exportador.descargar(this.visibles());
  }

  protected reservar(id: number): void {
    const libro = this.libros().find((l) => l.id === id);
    if (libro) this.carrito.anadir(libro);
  }
}
