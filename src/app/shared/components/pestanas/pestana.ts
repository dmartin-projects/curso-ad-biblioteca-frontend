import { Component, computed, inject, input } from '@angular/core';
import { Pestanas } from './pestanas';

@Component({
  selector: 'app-pestana',
  templateUrl: './pestana.html',
})
export class Pestana {
  readonly titulo = input.required<string>();
  private readonly grupo = inject(Pestanas); // el padre está en el árbol de inyectores
  protected readonly visible = computed(() => this.grupo.activa() === this);
}
