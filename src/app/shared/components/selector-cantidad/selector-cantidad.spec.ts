import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SelectorCantidad } from './selector-cantidad';

@Component({
  imports: [SelectorCantidad],
  template: `<app-selector-cantidad [(valor)]="cantidad" [min]="1" [max]="3" />`,
})
class Padre {
  readonly cantidad = signal(1);
}

describe('SelectorCantidad (model)', () => {
  it('sincroniza en los dos sentidos con la signal del padre y respeta los límites', async () => {
    const fixture = TestBed.createComponent(Padre);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const [menos, mas] = Array.from(el.querySelectorAll('button'));
    expect(menos.disabled).toBe(true); // ya está en el mínimo

    mas.click();
    mas.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.cantidad()).toBe(3); // hijo → padre
    expect(mas.disabled).toBe(true);

    fixture.componentInstance.cantidad.set(2); // padre → hijo
    await fixture.whenStable();
    expect(el.querySelector('span')?.textContent).toBe('2');
  });
});
