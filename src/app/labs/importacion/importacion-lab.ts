import { Component, DestroyRef, inject, signal } from '@angular/core';
import { generarCsv, parsearCsv, VistaPrevia } from './parsear';

/** Módulo 57, ejercicio 6: el mismo parseo en el hilo principal y en un web worker. */
@Component({
  selector: 'app-importacion-lab',
  templateUrl: './importacion-lab.html',
})
export default class ImportacionLab {
  protected readonly lineas = 300_000;
  private readonly texto = generarCsv(this.lineas);
  protected readonly vista = signal<VistaPrevia | null>(null);
  protected readonly estado = signal('');
  private worker?: Worker;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.worker?.terminate());
  }

  protected conceptos(v: VistaPrevia): number {
    return Object.keys(v.porConcepto).length;
  }

  protected enHiloPrincipal(): void {
    this.estado.set('Procesando…'); // ni siquiera esto llega a pintarse: el hilo está ocupado
    this.vista.set(parsearCsv(this.texto));
    this.estado.set('Hecho (hilo principal)');
  }

  protected enWorker(): void {
    this.estado.set('Procesando en segundo plano…'); // esto sí se pinta al instante
    this.worker ??= new Worker(new URL('./parsear-csv.worker', import.meta.url), {
      type: 'module',
    });
    this.worker.onmessage = ({ data }: MessageEvent<VistaPrevia>) => {
      this.vista.set(data);
      this.estado.set('Hecho (web worker)');
    };
    this.worker.postMessage(this.texto);
  }
}
