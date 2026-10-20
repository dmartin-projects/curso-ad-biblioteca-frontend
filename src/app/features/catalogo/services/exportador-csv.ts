import { Service } from '@angular/core';
import { Libro } from '../interfaces/catalogo.models';

/** Se carga con injectAsync: vive en su propio chunk. Debe ser auto-provisto (@Service()). */
@Service()
export class ExportadorCsv {
  generar(libros: readonly Libro[]): string {
    const celda = (v: unknown) => `"${String(v).replaceAll('"', '""')}"`;
    const filas = libros.map((l) =>
      [l.id, l.titulo, l.autores.join(', '), l.ejemplares_disponibles].map(celda).join(';'),
    );
    return ['id;titulo;autores;disponibles', ...filas].join('\r\n');
  }

  descargar(libros: readonly Libro[], nombre = 'catalogo.csv'): void {
    const blob = new Blob(['﻿' + this.generar(libros)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); // revocar al instante puede cancelar la descarga
  }
}
