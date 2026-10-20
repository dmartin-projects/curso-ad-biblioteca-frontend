import { TestBed } from '@angular/core/testing';
import { Confirmaciones } from './confirmaciones';

describe('Confirmaciones (Dialog del CDK)', () => {
  const dialogo = () => document.querySelector<HTMLElement>('app-confirmar');
  const esperar = () => new Promise((r) => setTimeout(r, 20));

  it('abre un alertdialog y devuelve true al confirmar', async () => {
    const respuesta = TestBed.inject(Confirmaciones).preguntar('Borrar gasto', '¿Seguro?');
    await esperar();
    // UN solo role, el del contenedor del CDK, enlazado con el título y el mensaje
    const roles = document.querySelectorAll('[role=dialog], [role=alertdialog]');
    expect([...roles].map((r) => r.getAttribute('role'))).toEqual(['alertdialog']);
    const contenedor = roles[0];
    const titulo = document.getElementById(contenedor.getAttribute('aria-labelledby')!);
    const mensaje = document.getElementById(contenedor.getAttribute('aria-describedby')!);
    expect([titulo?.textContent, mensaje?.textContent]).toEqual(['Borrar gasto', '¿Seguro?']);
    expect(dialogo()?.hasAttribute('role')).toBe(false);
    // (el foco en "Confirmar" se comprueba en el navegador: jsdom no calcula visibilidad y el
    //  CDK avisa "Element matching '[cdkFocusInitial]' is not focusable")
    dialogo()!.querySelector<HTMLButtonElement>('.confirmar')!.click();
    expect(await respuesta).toBe(true);
    expect(dialogo()).toBeNull();
  });

  it('Escape cierra y cuenta como "no"', async () => {
    const respuesta = TestBed.inject(Confirmaciones).preguntar('Borrar', '¿Seguro?');
    await esperar();
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    // el CDK mira keyCode (27), y jsdom no lo rellena a partir de `key`
    Object.defineProperty(escape, 'keyCode', { value: 27 });
    document.body.dispatchEvent(escape);
    expect(await respuesta).toBe(false);
  });
});
