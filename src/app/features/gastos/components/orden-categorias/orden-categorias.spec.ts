import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Categoria } from '../selector-categoria/selector-categoria';
import { OrdenCategorias } from './orden-categorias';

@Component({
  imports: [OrdenCategorias],
  template: `<app-orden-categorias
    [(categorias)]="categorias"
    (reordenado)="ordenes.push($event)"
  />`,
})
class Anfitrion {
  readonly categorias = signal<Categoria[]>([
    { id: 1, nombre: 'Súper', color: '' },
    { id: 2, nombre: 'Ocio', color: '' },
    { id: 3, nombre: 'Casa', color: '' },
  ]);
  readonly ordenes: number[][] = [];
}

describe('OrdenCategorias', () => {
  it('botones subir/bajar (alternativa de teclado al arrastre) y two-way binding', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const nombres = () => [...el.querySelectorAll('.nombre')].map((n) => n.textContent);
    expect(el.querySelector<HTMLButtonElement>('[aria-label="Subir Súper"]')!.disabled).toBe(true);

    el.querySelector<HTMLButtonElement>('[aria-label="Bajar Súper"]')!.click();
    await fixture.whenStable();
    expect(nombres()).toEqual(['Ocio', 'Súper', 'Casa']);
    el.querySelector<HTMLButtonElement>('[aria-label="Subir Casa"]')!.click();
    await fixture.whenStable();
    expect(nombres()).toEqual(['Ocio', 'Casa', 'Súper']);
    expect(fixture.componentInstance.categorias().map((c) => c.id)).toEqual([2, 3, 1]); // el padre lo ve
    expect(fixture.componentInstance.ordenes).toEqual([
      [2, 1, 3],
      [2, 3, 1],
    ]);
  });
});
