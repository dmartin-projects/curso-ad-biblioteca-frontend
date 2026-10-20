import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge, of, Subject, switchMap, tap } from 'rxjs';
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
  protected readonly clicGuardar$ = new Subject<void>();

  /** Carga al principio y cada vez que alguien (este u otro componente) guarda un gasto. */
  protected readonly gastos$ = merge(of(null), this.eventos.guardado$).pipe(
    switchMap(() => this.api.listar()),
  );

  constructor() {
    this.clicGuardar$
      .pipe(
        guardarSinDobles(() => this.api.crear('Nuevo gasto')),
        tap((g) => this.eventos.notificarGuardado(g)),
        takeUntilDestroyed(), // se cancela al destruir el componente (módulo 48)
      )
      .subscribe();
  }
}
