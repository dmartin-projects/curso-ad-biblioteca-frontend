import { Component, computed, inject } from '@angular/core';
import { Avisos } from '../avisos';

@Component({
  selector: 'app-avisos',
  templateUrl: './avisos-globales.html',
  styleUrl: './avisos-globales.scss',
})
export class AvisosGlobales {
  protected readonly avisos = inject(Avisos);
  /** Errores en un role="alert" (se anuncian al momento); el resto, en un role="status" (polite). */
  protected readonly errores = computed(() =>
    this.avisos.lista().filter((a) => a.tipo === 'error'),
  );
  protected readonly otros = computed(() => this.avisos.lista().filter((a) => a.tipo !== 'error'));
}
