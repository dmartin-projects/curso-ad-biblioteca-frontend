import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, merge, of, Subject, switchMap, tap } from 'rxjs';
import { HogarStore } from '../../../../core/hogar/hogar-store';
import { guardarSinDobles } from '../../../../shared/utils/flujos';
import { EventosGastos } from '../../services/eventos-gastos';
import { GastosApiFalsa } from '../../services/gastos-api-falsa';

@Component({
  selector: 'app-listado-gastos',
  imports: [AsyncPipe],
  templateUrl: './listado-gastos.html',
})
export class ListadoGastos {
  private readonly api = inject(GastosApiFalsa);
  private readonly eventos = inject(EventosGastos);
  private readonly hogar = inject(HogarStore);
  protected readonly clicGuardar$ = new Subject<void>();

  /**
   * Carga al principio, cada vez que alguien guarda un gasto y cada vez que cambia el hogar
   * activo (módulo 54): el estado global manda y los datos de servidor le siguen.
   */
  protected readonly gastos$ = combineLatest([
    toObservable(this.hogar.activo),
    merge(of(null), this.eventos.guardado$),
  ]).pipe(switchMap(([hogar]) => this.api.listar(hogar?.id)));

  constructor() {
    this.clicGuardar$
      .pipe(
        guardarSinDobles(() => this.api.crear('Nuevo gasto', this.hogar.activo()?.id)),
        tap((g) => this.eventos.notificarGuardado(g)),
        takeUntilDestroyed(), // se cancela al destruir el componente (módulo 48)
      )
      .subscribe();
  }
}
