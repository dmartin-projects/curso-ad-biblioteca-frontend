import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PanelFiltros } from './panel-filtros';

@Component({
  imports: [PanelFiltros],
  template: `<app-panel-filtros><p class="contenido">Hola</p></app-panel-filtros>`,
})
class Anfitrion {}

describe('PanelFiltros', () => {
  it('abre con el botón, proyecta el contenido y se cierra con Escape', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.contenido')).toBeNull();

    el.querySelector('button')!.click();
    await fixture.whenStable();
    expect(el.querySelector('.contenido')?.textContent).toBe('Hola');
    expect(el.querySelector('button')!.getAttribute('aria-expanded')).toBe('true');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(el.querySelector('.contenido')).toBeNull();
  });
});
