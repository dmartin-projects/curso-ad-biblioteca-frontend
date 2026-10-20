import { Service } from '@angular/core';

/** Abstracción: el código inyecta Almacenamiento y no sabe qué hay detrás. */
export abstract class Almacenamiento {
  abstract leer(clave: string): string | null;
  abstract guardar(clave: string, valor: string): void;
}

@Service({ autoProvided: false })
export class AlmacenamientoLocal extends Almacenamiento {
  leer(clave: string): string | null {
    try {
      return localStorage.getItem(clave);
    } catch {
      return null; // modo privado, cuota llena, SSR…
    }
  }
  guardar(clave: string, valor: string): void {
    try {
      localStorage.setItem(clave, valor);
    } catch {
      /* sin almacenamiento: no pasa nada */
    }
  }
}

/** Para tests y SSR: vive en memoria y desaparece con el inyector. */
@Service({ autoProvided: false })
export class AlmacenamientoMemoria extends Almacenamiento {
  private readonly datos = new Map<string, string>();
  leer(clave: string): string | null {
    return this.datos.get(clave) ?? null;
  }
  guardar(clave: string, valor: string): void {
    this.datos.set(clave, valor);
  }
}
