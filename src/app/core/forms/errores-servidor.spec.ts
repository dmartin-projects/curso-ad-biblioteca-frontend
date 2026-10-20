import { Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { ErrorApi } from '../http/errores';
import { erroresDelServidor } from './errores-servidor';

/** Módulo 62: el traductor de errores de la API (módulo 38) a errores de Signal Forms. */
describe('erroresDelServidor', () => {
  const crearFormulario = () =>
    runInInjectionContext(TestBed.inject(Injector), () =>
      form(signal({ titulo: '', lineas: [{ precio: 0 }, { precio: 0 }] })),
    );

  it('cada error va a su campo, también los anidados ("lineas.1.precio")', () => {
    const f = crearFormulario();
    const e = new ErrorApi(400, 'validacion', 'Los datos enviados no son válidos.', {
      titulo: ['Obligatorio.'],
      'lineas.1.precio': ['Debe ser positivo.', 'Máximo 2 decimales.'],
    });
    const errores = erroresDelServidor(e, f);
    expect(errores.map((x) => [x.message, x.fieldTree])).toEqual([
      ['Obligatorio.', f.titulo],
      ['Debe ser positivo.', f.lineas[1].precio],
      ['Máximo 2 decimales.', f.lineas[1].precio],
    ]);
  });

  it('non_field_errors y campos que el formulario no tiene → al formulario raíz', () => {
    const f = crearFormulario();
    const e = new ErrorApi(400, 'validacion', '…', {
      non_field_errors: ['Ya existe un libro con ese ISBN.'],
      campo_que_no_existe: ['¿?'],
    });
    expect(erroresDelServidor(e, f).every((x) => x.fieldTree === f)).toBe(true);
  });

  it('un error que no es de validación (403, 500, sin conexión) da un único error general', () => {
    const f = crearFormulario();
    expect(erroresDelServidor(new ErrorApi(403, 'sin_permiso', 'No tienes permiso.'), f)).toEqual([
      { kind: 'servidor', message: 'No tienes permiso.' },
    ]);
    expect(erroresDelServidor(new TypeError('x'), f)).toEqual([
      { kind: 'servidor', message: 'No se pudo guardar' },
    ]);
  });
});
