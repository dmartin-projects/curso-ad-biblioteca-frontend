import {
  Component,
  computed,
  ElementRef,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { Autor } from '../../interfaces/catalogo.models';

/**
 * Control propio para Signal Forms: guarda los ids de los autores elegidos. Presentational: avisa
 * de lo que se escribe (buscar) y pinta las sugerencias que le da la página.
 */
@Component({
  selector: 'app-selector-autores',
  templateUrl: './selector-autores.html',
})
export class SelectorAutores implements FormValueControl<number[]> {
  readonly value = model<number[]>([]); // obligatorio: el valor, en ambos sentidos
  readonly disabled = input(false); // opcionales: los rellena el formulario…
  readonly invalid = input(false);
  readonly touch = output<void>(); // …y este avisa de que el usuario lo ha tocado
  /** Los autores ya conocidos (en edición, los del libro), para pintar sus nombres. */
  readonly iniciales = input<Autor[]>([]);

  /** Los autores que encajan con lo escrito (los busca la página). */
  readonly sugerencias = input<Autor[]>([]);
  readonly buscar = output<string>();

  protected readonly termino = signal('');
  private readonly campo = viewChild.required<ElementRef<HTMLInputElement>>('campo');

  private readonly conocidos = signal(new Map<number, Autor>());
  protected readonly elegidos = computed(() => {
    const mapa = new Map([...this.iniciales().map((a) => [a.id, a] as const), ...this.conocidos()]);
    return this.value()
      .map((id) => mapa.get(id))
      .filter((a): a is Autor => !!a);
  });

  /** focusBoundControl() (al enviar el formulario con errores) llama a este método. */
  focus(): void {
    this.campo().nativeElement.focus();
  }

  protected elegir(a: Autor): void {
    this.conocidos.update((m) => new Map(m).set(a.id, a));
    if (!this.value().includes(a.id)) this.value.update((ids) => [...ids, a.id]);
    this.escribir('');
    this.touch.emit();
  }

  protected escribir(texto: string): void {
    this.termino.set(texto);
    this.buscar.emit(texto);
  }

  protected quitar(id: number): void {
    this.value.update((ids) => ids.filter((x) => x !== id));
    this.touch.emit();
  }
}
