import { Component, DestroyRef, inject } from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { scan } from 'rxjs';
import { EventosGastos } from '../../features/gastos/services/eventos-gastos';
import { GastosApiFalsa } from '../../features/gastos/services/gastos-api-falsa';

/** Base común: el recurso de gastos y un método recargar() que los tests espían. */
abstract class ListaGastosBase {
  protected readonly eventos = inject(EventosGastos);
  private readonly api = inject(GastosApiFalsa);
  readonly gastos = rxResource({ stream: () => this.api.listar(), defaultValue: [] });

  recargar(): void {
    console.log(`[${this.constructor.name}] recargar`); // ejercicio 1: el console.log delator
    this.gastos.reload();
  }
}

/** ❌ FUGA: cada instancia deja un suscriptor vivo en el Subject del servicio raíz. */
@Component({ selector: 'app-lista-gastos-fuga', templateUrl: './lista-gastos.html' })
export class ListaGastosFuga extends ListaGastosBase {
  constructor() {
    super();
    this.eventos.guardado$.subscribe(() => this.recargar());
  }
}

/** ✅ Arreglo 1: takeUntilDestroyed (el último del pipe). */
@Component({ selector: 'app-lista-gastos-tud', templateUrl: './lista-gastos.html' })
export class ListaGastosTud extends ListaGastosBase {
  constructor() {
    super();
    this.eventos.guardado$.pipe(takeUntilDestroyed()).subscribe(() => this.recargar());
  }
}

/** ✅ Arreglo 2: DestroyRef + unsubscribe (útil fuera del constructor). */
@Component({ selector: 'app-lista-gastos-destroyref', templateUrl: './lista-gastos.html' })
export class ListaGastosDestroyRef extends ListaGastosBase {
  constructor() {
    super();
    const sub = this.eventos.guardado$.subscribe(() => this.recargar());
    inject(DestroyRef).onDestroy(() => sub.unsubscribe());
  }
}

/**
 * ✅ Arreglo 3: toSignal. Aplica cuando lo que quieres es PINTAR algo derivado del flujo
 * (aquí, cuántos gastos se han guardado desde que abriste la pantalla). Para EJECUTAR una
 * acción (recargar) no aplica: eso es un subscribe con takeUntilDestroyed.
 */
@Component({
  selector: 'app-contador-guardados',
  templateUrl: './contador-guardados.html',
})
export class ContadorGuardados {
  protected readonly guardados = toSignal(
    inject(EventosGastos).guardado$.pipe(scan((n) => n + 1, 0)),
    { initialValue: 0 },
  );
}
