import { inject, Service } from '@angular/core';
import { Almacenamiento } from './almacenamiento';

/** Preferencias del usuario serializadas en JSON sobre el Almacenamiento que toque. */
@Service()
export class Preferencias {
  private readonly almacen = inject(Almacenamiento);

  leer<T extends object>(clave: string, porDefecto: T): T {
    try {
      return { ...porDefecto, ...JSON.parse(this.almacen.leer(clave) ?? '{}') };
    } catch {
      return porDefecto; // JSON corrupto
    }
  }

  guardar(clave: string, valor: unknown): void {
    this.almacen.guardar(clave, JSON.stringify(valor));
  }
}
