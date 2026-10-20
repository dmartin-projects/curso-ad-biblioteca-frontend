import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'iban' })
export class IbanPipe implements PipeTransform {
  transform(iban: string | null | undefined, ocultar = true): string {
    if (!iban) return '';
    const limpio = iban.replace(/\s+/g, '').toUpperCase();
    const visible =
      ocultar && limpio.length > 8
        ? limpio.slice(0, 4) + '•'.repeat(limpio.length - 8) + limpio.slice(-4)
        : limpio;
    return visible.replace(/(.{4})/g, '$1 ').trim();
  }
}
