import { FieldTree, ValidationError } from '@angular/forms/signals';
import { ErrorApi } from '../http/errores';

/** Convierte {"titulo": [...], "lineas.1.precio": [...]} (módulo 38) en errores de Signal Forms. */
export function erroresDelServidor(
  e: unknown,
  raiz: FieldTree<unknown>,
): ValidationError.WithOptionalFieldTree[] {
  if (!(e instanceof ErrorApi) || e.tipo !== 'validacion') {
    // error general (403, 500, sin conexión…): sin fieldTree → queda en el formulario raíz
    return [{ kind: 'servidor', message: e instanceof ErrorApi ? e.titulo : 'No se pudo guardar' }];
  }
  return Object.entries(e.errores).flatMap(([ruta, mensajes]) => {
    const campo = ruta === 'non_field_errors' ? undefined : buscarCampo(raiz, ruta.split('.'));
    return mensajes.map((message) => ({ kind: 'servidor', message, fieldTree: campo ?? raiz }));
  });
}

function buscarCampo(raiz: FieldTree<unknown>, partes: string[]): FieldTree<unknown> | undefined {
  let actual: unknown = raiz;
  for (const p of partes) {
    actual = (actual as Record<string, unknown> | undefined)?.[p];
    if (actual === undefined) return undefined;
  }
  return actual as FieldTree<unknown>;
}
