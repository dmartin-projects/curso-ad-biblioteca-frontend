import { Pipe, PipeTransform } from '@angular/core';

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
const UNIDADES: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
  ['second', 1],
];

@Pipe({ name: 'tiempoRelativo' })
export class TiempoRelativoPipe implements PipeTransform {
  transform(valor: string | Date | null | undefined, ahora: number = Date.now()): string {
    if (!valor) return '';
    const segundos = Math.round((new Date(valor).getTime() - ahora) / 1000);
    for (const [unidad, s] of UNIDADES) {
      if (Math.abs(segundos) >= s || unidad === 'second') {
        return rtf.format(Math.round(segundos / s), unidad);
      }
    }
    return '';
  }
}
