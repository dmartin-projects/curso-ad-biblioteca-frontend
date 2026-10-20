import { Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Importe en formato español ("1.234,5") para formularios clásicos (formControlName/ngModel). */
@Component({
  selector: 'app-input-importe',
  templateUrl: './input-importe.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => InputImporte), multi: true },
  ],
})
export class InputImporte implements ControlValueAccessor {
  protected readonly texto = signal('');
  protected readonly deshabilitado = signal(false);
  private onChange: (v: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: number | null): void {
    this.texto.set(v == null ? '' : String(v).replace('.', ',')); // modelo → vista
  }
  registerOnChange(fn: (v: number | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(d: boolean): void {
    this.deshabilitado.set(d);
  }

  protected cambiar(t: string): void {
    // vista → modelo. "1.234,56": con coma, el punto es de miles. "1234.56": sin coma, el punto es
    // el decimal (lo que escribe el teclado numérico de muchos móviles)
    this.texto.set(t);
    const n = Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t);
    this.onChange(t.trim() === '' || Number.isNaN(n) ? null : n);
  }
  protected alTocar(): void {
    this.onTouched();
  }
}
