import { Component, contentChildren, linkedSignal } from '@angular/core';
import { Pestana } from './pestana';

@Component({
  selector: 'app-pestanas',
  templateUrl: './pestanas.html',
})
export class Pestanas {
  readonly pestanas = contentChildren(Pestana);
  readonly activa = linkedSignal(() => this.pestanas()[0]); // la primera, hasta que el usuario elija
}
