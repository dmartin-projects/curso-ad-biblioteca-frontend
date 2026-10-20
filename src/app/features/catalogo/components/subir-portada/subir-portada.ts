import { Component, input, output, signal } from '@angular/core';

const MAXIMO = 2 * 1024 * 1024; // el mismo límite que el servidor (módulo 38)

/** Presentational: elige el archivo y enseña el progreso. La subida la hace la página. */
@Component({
  selector: 'app-subir-portada',
  templateUrl: './subir-portada.html',
})
export class SubirPortada {
  readonly progreso = input<number | null>(null); // % enviado; null = no hay subida en curso
  readonly error = input(''); // el error de la subida, si lo hubo
  readonly archivo = output<File>();
  protected readonly errorLocal = signal('');

  protected elegir(evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (!archivo) return;
    // en el cliente, por experiencia de usuario; la validación de verdad es la del servidor
    if (archivo.size > MAXIMO) {
      this.errorLocal.set('La portada no puede pasar de 2 MB.');
      return;
    }
    this.errorLocal.set('');
    this.archivo.emit(archivo);
  }
}
