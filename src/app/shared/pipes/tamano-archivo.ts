import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'tamanoArchivo' })
export class TamanoArchivoPipe implements PipeTransform {
  transform(bytes: number | null | undefined, decimales = 1): string {
    if (bytes == null) return '';
    const unidades = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let v = bytes;
    while (v >= 1024 && i < unidades.length - 1) {
      v /= 1024;
      i++;
    }
    return `${v.toLocaleString('es', { maximumFractionDigits: decimales })} ${unidades[i]}`;
  }
}
