import { ChangeDetectorRef, Component, inject, Service, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject } from 'rxjs';

@Service()
export class ServicioDatos {
  readonly datos$ = new BehaviorSubject<string[]>([]);
}

/** Ejercicio 1, tal cual la sección 4: dos de las tres cosas NO se ven. */
@Component({
  selector: 'app-ejemplo-roto',
  templateUrl: './ejemplo-roto.html',
})
export class EjemploRoto {
  mensaje = 'inicial';
  readonly contador = signal(0);
  lista: string[] = [];

  constructor() {
    setTimeout(() => (this.mensaje = 'cambiado'), 100); // ❌ sin notificación
    setTimeout(() => this.contador.set(1), 200); // ✅ signal (¡y de paso repinta lo anterior!)
    inject(ServicioDatos).datos$.subscribe((d) => (this.lista = d)); // ❌
  }
}

/** Arreglado con signals y toSignal. */
@Component({
  selector: 'app-ejemplo-arreglado',
  templateUrl: './ejemplo-arreglado.html',
})
export class EjemploArreglado {
  readonly mensaje = signal('inicial');
  readonly contador = signal(0);
  readonly lista = toSignal(inject(ServicioDatos).datos$, { requireSync: true });

  constructor() {
    setTimeout(() => this.mensaje.set('cambiado'), 100);
    setTimeout(() => this.contador.set(1), 200);
  }
}

/** El parche para código heredado: markForCheck() tras cambiar la propiedad. */
@Component({
  selector: 'app-ejemplo-parche',
  templateUrl: './ejemplo-parche.html',
})
export class EjemploParche {
  mensaje = 'inicial';
  constructor() {
    const cdr = inject(ChangeDetectorRef);
    setTimeout(() => {
      this.mensaje = 'cambiado';
      cdr.markForCheck();
    }, 100);
  }
}
