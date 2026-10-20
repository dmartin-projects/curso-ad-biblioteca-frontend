import {
  Component,
  computed,
  debounced,
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
import { CatalogoApi } from '../../services/catalogo-api';
import { GenerosStore } from '../../../../core/generos/generos';
import { CONFIG_CATALOGO } from '../../catalogo.config';
import { FiltrosLibro, Libro } from '../../interfaces/catalogo.models';
import { FiltrosLibros } from '../../components/filtros-libros/filtros-libros';
import {
  FiltrosAvanzados,
  RangoPublicacion,
} from '../../components/filtros-avanzados/filtros-avanzados';
import { ListaLibros } from '../../components/lista-libros/lista-libros';

const esperar = (ms: number) => new Promise<void>((listo) => setTimeout(listo, ms));

/**
 * Contenedor. Los datos vienen de la API; filtros y página viven en la URL (?search=dune&disponibles=true&page=2):
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
    FiltrosAvanzados,
  ],
  templateUrl: './catalogo-page.html',
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
  readonly genero = input(undefined, {
    transform: (v: unknown) => (v ? numberAttribute(v) : undefined),
  });
  protected readonly generos = inject(GenerosStore);
  readonly publicado_desde = input<string>();
  readonly publicado_hasta = input<string>();

  readonly compacta = signal(false);
  readonly filtros = computed<FiltrosLibro>(() => ({
    texto: this.search(),
    soloDisponibles: this.disponibles(),
  }));

  /**
   * La URL cambia con cada tecla (replaceUrl), pero la consulta espera a que el usuario deje de
   * escribir 300 ms. Solo cuando cambia el texto: un clic en "Siguiente" o en un filtro va al
   * instante.
   */
  private readonly consulta = debounced(
    computed(() => ({
      search: this.search(),
      disponible: this.disponibles(),
      genero: this.genero() ? [this.genero()!] : undefined,
      publicado_desde: this.publicado_desde(),
      publicado_hasta: this.publicado_hasta(),
      page: this.page(),
      page_size: this.tamano,
    })),
    (nueva, anterior) =>
      'value' in anterior && nueva.search !== anterior.value.search ? esperar(300) : undefined,
  );

  /** Filtrar y paginar lo hace el servidor: la URL → la consulta → el recurso. */
  protected readonly resultado = inject(CatalogoApi).librosResource(this.consulta.value);
  // ⚠️ value() LANZA si el recurso está en error: siempre detrás de hasValue()
  readonly visibles = computed(() =>
    this.resultado.hasValue() ? this.resultado.value().results : [],
  );
  readonly total = computed(() => (this.resultado.hasValue() ? this.resultado.value().count : 0));

  /** Cambiar filtros = navegar. page: null la quita de la URL (vuelve a la 1). */
  cambiarFiltros(f: FiltrosLibro): void {
    this.router.navigate([], {
      queryParams: { search: f.texto || null, disponibles: f.soloDisponibles || null, page: null },
      queryParamsHandling: 'merge',
      replaceUrl: true, // escribir no debe llenar el historial de entradas
    });
  }

  cambiarRango(r: RangoPublicacion): void {
    this.router.navigate([], {
      queryParams: { publicado_desde: r.desde, publicado_hasta: r.hasta, page: null },
      queryParamsHandling: 'merge',
    });
  }

  cambiarGenero(id: string): void {
    this.router.navigate([], {
      queryParams: { genero: id || null, page: null },
      queryParamsHandling: 'merge',
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
    const libro = this.visibles().find((l) => l.id === id);
    if (libro) this.carrito.anadir(libro);
  }
}
