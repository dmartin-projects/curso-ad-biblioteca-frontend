import { Service } from '@angular/core';
import { Subject } from 'rxjs';

export interface GastoSimple {
  id: number;
  concepto: string;
  hogar?: number;
}

/** Bus de eventos: privado + asObservable() → desde fuera solo se puede escuchar. */
@Service()
export class EventosGastos {
  private readonly _guardado = new Subject<GastoSimple>();
  readonly guardado$ = this._guardado.asObservable();

  notificarGuardado(g: GastoSimple): void {
    this._guardado.next(g);
  }
}
