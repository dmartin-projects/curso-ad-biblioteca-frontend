import { Pipe, PipeTransform } from '@angular/core';

/** Pipe PURO: solo se re-ejecuta si cambia la referencia de items, campo o valor. */
@Pipe({ name: 'filtrarPor' })
export class FiltrarPorPipe implements PipeTransform {
  transform<T>(items: readonly T[], campo: keyof T, valor: unknown): T[] {
    return items.filter((i) => i[campo] === valor);
  }
}
