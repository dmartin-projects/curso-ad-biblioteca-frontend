import { Component, computed, debounced, effect, inject, input, signal } from '@angular/core';
import {
  debounce,
  FieldTree,
  form,
  FormField,
  FormRoot,
  max,
  maxLength,
  min,
  minLength,
  pattern,
  required,
  validate,
  validateHttp,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Autor, LibroLista, Paginado } from '../../../../core/api/tipos';
import { AutoresApi } from '../../../../core/autores/autores-api';
import { ConCambios } from '../../../../core/auth/guards';
import { erroresDelServidor } from '../../../../core/forms/errores-servidor';
import { CatalogoApi } from '../../services/catalogo-api';
import { SelectorAutores } from '../../components/selector-autores/selector-autores';

export interface DatosLibro {
  titulo: string;
  isbn: string;
  paginas: number | null;
  publicado: string; // 'yyyy-mm-dd' (input type="date"); '' = sin fecha
  sinopsis: string;
  autores_ids: number[];
}

const VACIO: DatosLibro = {
  titulo: '',
  isbn: '',
  paginas: null,
  publicado: '',
  sinopsis: '',
  autores_ids: [],
};
const hoy = () => new Date().toISOString().slice(0, 10);

/** Alta (/catalogo/nuevo) y edición (/catalogo/libros/:id/editar) con Signal Forms. */
@Component({
  selector: 'app-formulario-libro',
  imports: [FormField, FormRoot, SelectorAutores, RouterLink],
  templateUrl: './formulario-libro.html',
})
export default class FormularioLibro implements ConCambios {
  private readonly api = inject(CatalogoApi);
  private readonly router = inject(Router);
  /** En edición llega de la ruta (:id); en alta, undefined. */
  readonly id = input<string>();
  private readonly idNumerico = computed(() => (this.id() ? Number(this.id()) : undefined));

  protected readonly modelo = signal<DatosLibro>({ ...VACIO });
  private readonly guardado = signal(false);

  // En edición: cargar el libro y volcarlo en el modelo
  private readonly original = this.api.libroResource(this.idNumerico);
  protected readonly autoresIniciales = signal<Autor[]>([]);

  // Sugerencias para el selector de autores: el término llega del selector; la búsqueda, aquí
  protected readonly terminoAutor = signal('');
  private readonly terminoAutorEstable = debounced(() => this.terminoAutor().trim(), 300);
  private readonly autores = inject(AutoresApi).buscar(this.terminoAutorEstable.value, 8);
  protected readonly sugerencias = computed(() =>
    this.autores.hasValue() ? this.autores.value().results : [],
  );

  protected readonly f = form(
    this.modelo,
    (r) => {
      required(r.titulo, { message: 'El título es obligatorio' });
      minLength(r.titulo, 2, { message: 'Mínimo 2 caracteres' });
      maxLength(r.titulo, 200, { message: 'Máximo 200 caracteres' });

      required(r.isbn, { message: 'El ISBN es obligatorio' });
      // el servidor exige 13 dígitos (módulo 33); se admiten guiones al escribir
      pattern(r.isbn, /^97[89]-?(\d-?){9}\d$/, { message: 'ISBN-13 no válido (978… o 979…)' });
      debounce(r.isbn, 300);
      validateHttp(r.isbn, {
        request: ({ value }) => {
          const isbn = value().replace(/-/g, '');
          return /^97[89]\d{10}$/.test(isbn) ? this.api.comprobacionIsbn(isbn) : undefined;
        },
        onSuccess: (resp: Paginado<LibroLista>, { value }) =>
          resp.results.some(
            (l) => l.isbn === value().replace(/-/g, '') && l.id !== this.idNumerico(),
          )
            ? { kind: 'duplicado', message: 'Ya existe un libro con ese ISBN' }
            : null,
        onError: () => null, // si la comprobación falla, no bloqueamos (el servidor tiene la última palabra)
      });

      min(r.paginas, 1, { message: 'Al menos 1 página' });
      max(r.paginas, 5000, { message: 'Como mucho 5000 páginas' });

      validate(r.publicado, ({ value }) =>
        value() && value() > hoy()
          ? { kind: 'futura', message: 'La fecha no puede ser futura' }
          : null,
      );
      validate(r.autores_ids, ({ value }) =>
        value().length === 0 ? { kind: 'sin_autores', message: 'Indica al menos un autor' } : null,
      );
    },
    {
      name: 'libro', // los <input> reciben name="libro.titulo", "libro.isbn"… (útil para autocompletar y tests)
      submission: {
        // al enviar con errores, el foco va al PRIMER campo inválido (en orden del DOM): quien usa
        // lector de pantalla oye qué falla en vez de pulsar "Guardar"… y no oír nada
        onInvalid: (f) => f().errorSummary()[0]?.fieldTree().focusBoundControl(),
        action: async (f) => {
          const datos = this.modelo();
          const cuerpo = {
            ...datos,
            isbn: datos.isbn.replace(/-/g, ''),
            publicado: datos.publicado || null,
          };
          try {
            const id = this.idNumerico();
            const libro = await firstValueFrom(
              id ? this.api.actualizarLibro(id, cuerpo) : this.api.crearLibro(cuerpo),
            );
            this.guardado.set(true); // para que el canDeactivate no pregunte al salir
            await this.router.navigate(['/catalogo/libros', libro.id]);
            return null; // éxito
          } catch (e) {
            return erroresDelServidor(e, f); // errores 400 de DRF → en cada campo
          }
        },
      },
    },
  );

  constructor() {
    effect(() => {
      if (!this.original.hasValue()) return;
      const l = this.original.value();
      this.modelo.set({
        titulo: l.titulo,
        isbn: l.isbn,
        paginas: l.paginas ?? null,
        publicado: l.publicado ?? '',
        sinopsis: l.sinopsis ?? '',
        autores_ids: l.autores.map((a) => a.id),
      });
      this.autoresIniciales.set(l.autores);
    });
  }

  /** Los errores se ven (y se anuncian) cuando el campo está touched: al salir de él o al enviar. */
  protected mostrarError(campo: FieldTree<unknown>): boolean {
    return campo().touched() && campo().invalid();
  }

  tieneCambios(): boolean {
    return this.f().dirty() && !this.guardado();
  }
}
