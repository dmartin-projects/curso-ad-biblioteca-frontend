import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, firstValueFrom, map } from 'rxjs';
import { Hogar, HogaresApiFalsa } from './hogares-api-falsa';

interface EstadoHogar {
  hogares: Hogar[];
  activoId: number | null;
}
const INICIAL: EstadoHogar = { hogares: [], activoId: null };

/** Ejercicio 4: el mismo store con el patrón clásico (lo verás en proyectos anteriores a las signals). */
@Injectable({ providedIn: 'root' })
export class HogarStoreClasico {
  private readonly api = inject(HogaresApiFalsa);
  private readonly _estado = new BehaviorSubject<EstadoHogar>(INICIAL);
  readonly estado$ = this._estado.asObservable();

  readonly hogares$ = this.estado$.pipe(
    map((s) => s.hogares),
    distinctUntilChanged(),
  );
  readonly activo$ = this.estado$.pipe(
    map((s) => s.hogares.find((h) => h.id === s.activoId) ?? s.hogares[0] ?? null),
    distinctUntilChanged(),
  );

  async cargar(): Promise<void> {
    const hogares = await firstValueFrom(this.api.listar());
    this._estado.next({ ...this._estado.getValue(), hogares });
  }

  seleccionar(id: number): void {
    this._estado.next({ ...this._estado.getValue(), activoId: id });
  }
}
