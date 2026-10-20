import { Dialog } from '@angular/cdk/dialog';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Confirmar, DatosConfirmar } from './confirmar';

let siguiente = 0;

/** Ejercicio 6: confirmaciones con el Dialog del CDK (foco atrapado, Escape, aria-modal…). */
@Service()
export class Confirmaciones {
  private readonly dialog = inject(Dialog);

  preguntar(titulo: string, mensaje: string): Promise<boolean> {
    const n = ++siguiente; // dos diálogos apilados no pueden compartir id
    const ids = { titulo: `confirmar-titulo-${n}`, mensaje: `confirmar-mensaje-${n}` };
    const ref = this.dialog.open<boolean, DatosConfirmar>(Confirmar, {
      data: { titulo, mensaje, ids },
      // en la config, no en el host de Confirmar: el contenedor del CDK ya es el role="dialog";
      // otro role dentro sería un diálogo dentro de otro para el lector de pantalla
      role: 'alertdialog',
      ariaLabelledBy: ids.titulo,
      ariaDescribedBy: ids.mensaje,
    });
    return firstValueFrom(ref.closed).then((r) => r === true); // Escape o clic fuera → undefined → false
  }
}
