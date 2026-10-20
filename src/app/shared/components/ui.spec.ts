import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Lista } from './lista/lista';
import { Paginador } from './paginador/paginador';
import { Pestana } from './pestanas/pestana';
import { Pestanas } from './pestanas/pestanas';
import { Tarjeta } from './tarjeta/tarjeta';

async function pintar<T>(tipo: new () => T) {
  const fixture = TestBed.createComponent(tipo);
  await fixture.whenStable();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

@Component({
  imports: [Tarjeta],
  template: `
    <app-tarjeta id="llena"
      ><h2 tarjeta-titulo>Dune</h2>
      <p>cuerpo</p>
      <button tarjeta-acciones>Ok</button></app-tarjeta
    >
    <app-tarjeta id="vacia"><p>solo cuerpo</p></app-tarjeta>
  `,
})
class ConTarjetas {}

@Component({
  imports: [Lista],
  template: `
    <app-lista id="con" [items]="['a', 'b']" />
    <app-lista id="sin" [items]="[]"><span vacio>Nada que ver</span></app-lista>
  `,
})
class ConListas {}

@Component({
  imports: [Pestanas, Pestana],
  template: `
    <app-pestanas>
      <app-pestana titulo="Datos"><p class="datos">datos</p></app-pestana>
      <app-pestana titulo="Ejemplares"><p class="ejemplares">ejemplares</p></app-pestana>
    </app-pestanas>
  `,
})
class ConPestanas {}

@Component({
  imports: [Paginador],
  template: `<app-paginador [total]="45" [tamano]="20" [(pagina)]="pagina" />`,
})
class ConPaginador {
  readonly pagina = signal(1);
}

describe('UI compartida', () => {
  it('Tarjeta reparte el contenido en sus huecos y pone el título por defecto', async () => {
    const { el } = await pintar(ConTarjetas);
    const llena = el.querySelector('#llena')!;
    expect(llena.querySelector('header')?.textContent).toBe('Dune');
    expect(llena.querySelector('section')?.textContent).toBe('cuerpo');
    expect(llena.querySelector('footer button')).not.toBeNull();
    expect(el.querySelector('#vacia header')?.textContent).toBe('Sin título');
  });

  it('Lista pinta con la plantilla por defecto y proyecta el vacío', async () => {
    const { el } = await pintar(ConListas);
    expect(Array.from(el.querySelectorAll('#con li')).map((li) => li.textContent)).toEqual([
      'a',
      'b',
    ]);
    expect(el.querySelector('#sin li')?.textContent).toBe('Nada que ver');
  });

  it('Pestanas muestra la primera y cambia al pulsar', async () => {
    const { fixture, el } = await pintar(ConPestanas);
    expect(el.querySelector('.datos')).not.toBeNull();
    expect(el.querySelector('.ejemplares')).toBeNull();
    const [, segunda] = Array.from(el.querySelectorAll<HTMLButtonElement>('[role=tab]'));
    segunda.click();
    await fixture.whenStable();
    expect(el.querySelector('.datos')).toBeNull();
    expect(el.querySelector('.ejemplares')).not.toBeNull();
    expect(segunda.getAttribute('aria-selected')).toBe('true');
  });

  it('Paginador calcula páginas y respeta los límites', async () => {
    const { fixture, el } = await pintar(ConPaginador);
    const [anterior, siguiente] = Array.from(el.querySelectorAll('button'));
    expect(el.querySelector('span')?.textContent).toBe('Página 1 de 3');
    expect(anterior.disabled).toBe(true);
    siguiente.click();
    siguiente.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.pagina()).toBe(3);
    expect(siguiente.disabled).toBe(true);
  });
});
