import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { InputImporte } from './input-importe';

@Component({
  imports: [ReactiveFormsModule, InputImporte],
  template: `<app-input-importe [formControl]="importe" />`,
})
class Anfitrion {
  readonly importe = new FormControl<number | null>(12.5);
}

describe('InputImporte (ControlValueAccessor)', () => {
  it('modelo → vista, vista → modelo, touched y disabled', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    const control = fixture.componentInstance.importe;
    expect(input.value).toBe('12,5'); // writeValue

    input.value = '1.234,56';
    input.dispatchEvent(new Event('input'));
    expect(control.value).toBe(1234.56); // onChange
    input.value = '1234.56'; // sin coma, el punto es el decimal (teclado numérico del móvil)
    input.dispatchEvent(new Event('input'));
    expect(control.value).toBe(1234.56);
    input.value = 'abc';
    input.dispatchEvent(new Event('input'));
    expect(control.value).toBeNull();

    expect(control.touched).toBe(false);
    input.dispatchEvent(new Event('blur'));
    expect(control.touched).toBe(true); // onTouched

    control.disable();
    await fixture.whenStable();
    expect(input.disabled).toBe(true); // setDisabledState
  });
});
