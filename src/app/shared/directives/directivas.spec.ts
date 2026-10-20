import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BotonMenu } from '../components/boton-menu/boton-menu';
import { Autofocus } from './autofocus';
import { ClickFuera } from './click-fuera';
import { coincidencias, Resaltar } from './resaltar';

async function pintar<T>(tipo: new () => T) {
  const fixture = TestBed.createComponent(tipo);
  document.body.appendChild(fixture.nativeElement); // foco y clics "fuera" necesitan estar en el DOM
  await fixture.whenStable();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

@Component({
  imports: [Autofocus],
  template: `<input id="a" [appAutofocus]="false" /><input id="b" appAutofocus />`,
})
class ConAutofocus {}

@Component({
  imports: [ClickFuera],
  template: `<div id="menu" (appClickFuera)="fuera.set(fuera() + 1)">
    <button id="dentro">x</button>
  </div>`,
})
class ConClickFuera {
  readonly fuera = signal(0);
}

@Component({
  imports: [Resaltar],
  template: `<h3 [appResaltar]="titulo()" [termino]="termino()"></h3>`,
})
class ConResaltar {
  readonly titulo = signal('García <b>Márquez</b>');
  readonly termino = signal('garcia');
}

@Component({
  imports: [BotonMenu],
  template: `<app-boton-menu ayuda="Más opciones"
    ><button id="opcion">Opción</button></app-boton-menu
  >`,
})
class ConBotonMenu {}

describe('Directivas', () => {
  it('Autofocus enfoca solo si está activa', async () => {
    const { el } = await pintar(ConAutofocus);
    expect(document.activeElement).toBe(el.querySelector('#b'));
  });

  it('ClickFuera avisa solo de los clics fuera', async () => {
    const { fixture, el } = await pintar(ConClickFuera);
    el.querySelector<HTMLButtonElement>('#dentro')!.click();
    expect(fixture.componentInstance.fuera()).toBe(0);
    document.body.click();
    expect(fixture.componentInstance.fuera()).toBe(1);
  });

  it('Resaltar marca sin acentos ni mayúsculas y ESCAPA el texto', async () => {
    const { fixture, el } = await pintar(ConResaltar);
    const h3 = el.querySelector('h3')!;
    expect(h3.innerHTML).toBe('<mark>García</mark> &lt;b&gt;Márquez&lt;/b&gt;');
    expect(h3.querySelector('b')).toBeNull(); // el <b> del título es texto, no HTML
    fixture.componentInstance.termino.set('MARQ');
    await fixture.whenStable();
    expect(h3.querySelector('mark')?.textContent).toBe('Márq');
  });

  it('coincidencias(): varias, sin solaparse, con caracteres compuestos', () => {
    expect(coincidencias('Dune, Hijos de Dune', 'dune')).toEqual([
      [0, 4],
      [15, 19],
    ]);
    expect(coincidencias('aaaa', 'aa')).toEqual([
      [0, 2],
      [2, 4],
    ]);
    expect(coincidencias('Ñandú', 'nandu')).toEqual([[0, 5]]);
    expect(coincidencias('Dune', '')).toEqual([]);
  });

  it('BotonMenu compone ClickFuera y Tooltip con hostDirectives', async () => {
    const { fixture, el } = await pintar(ConBotonMenu);
    const host = el.querySelector('app-boton-menu')!;
    const boton = host.querySelector('button')!;
    boton.click();
    await fixture.whenStable();
    expect(el.querySelector('#opcion')).not.toBeNull();
    document.body.click(); // ClickFuera → se cierra
    await fixture.whenStable();
    expect(el.querySelector('#opcion')).toBeNull();

    host.dispatchEvent(new FocusEvent('focusin')); // Tooltip, también con teclado
    const id = host.getAttribute('aria-describedby')!;
    expect(document.getElementById(id)?.textContent).toBe('Más opciones');
    expect(document.getElementById(id)?.getAttribute('role')).toBe('tooltip');
    window.dispatchEvent(new Event('scroll')); // la burbuja no se queda flotando al hacer scroll
    expect(document.getElementById(id)).toBeNull();
    host.dispatchEvent(new FocusEvent('focusin'));
    fixture.destroy();
    expect(document.getElementById(id)).toBeNull(); // DestroyRef lo quita del body
  });
});
