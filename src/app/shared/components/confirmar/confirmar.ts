import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';

export interface DatosConfirmar {
  titulo: string;
  mensaje: string;
  /** Ids únicos del título y del mensaje: el contenedor del CDK los enlaza con aria-labelledby/-describedby. */
  ids: { titulo: string; mensaje: string };
}

/** El contenido del diálogo. El role (alertdialog) y los aria-* los pone el contenedor del CDK. */
@Component({
  selector: 'app-confirmar',
  templateUrl: './confirmar.html',
  styleUrl: './confirmar.scss',
})
export class Confirmar {
  protected readonly datos = inject<DatosConfirmar>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
}
