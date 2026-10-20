import { Service, signal } from '@angular/core';

export interface Aviso {
  id: number;
  tipo: 'exito' | 'error' | 'info';
  texto: string;
  /** El request_id de la API (módulo 38): lo que el usuario le da a soporte para buscar en los logs. */
  ref?: string;
}

/**
 * Avisos globales ("toasts"). Los de éxito e información desaparecen solos a los 5 s; los de error
 * se quedan hasta que el usuario los cierra: tiene que dar tiempo a leerlos (WCAG 2.2.1).
 */
@Service()
export class Avisos {
  private siguiente = 1;
  private readonly _lista = signal<Aviso[]>([]);
  readonly lista = this._lista.asReadonly();

  exito(texto: string): void {
    this.mostrar({ tipo: 'exito', texto });
  }
  error(texto: string, ref?: string): void {
    this.mostrar({ tipo: 'error', texto, ref });
  }
  info(texto: string): void {
    this.mostrar({ tipo: 'info', texto });
  }

  cerrar(id: number): void {
    this._lista.update((l) => l.filter((a) => a.id !== id));
  }

  private mostrar(aviso: Omit<Aviso, 'id'>): void {
    const id = this.siguiente++;
    this._lista.update((l) => [...l, { id, ...aviso }]);
    if (aviso.tipo !== 'error') setTimeout(() => this.cerrar(id), 5000);
  }
}
