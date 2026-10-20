import { Service } from '@angular/core';

/**
 * Preguntas de sí o no al usuario. Quien pregunta recibe una Promise y no sabe cómo se pregunta:
 * aquí, con el confirm() del navegador (que solo muestra el mensaje); en el módulo 55, con un
 * diálogo del CDK que usa también el título.
 */
@Service()
export class Confirmaciones {
  preguntar(titulo: string, mensaje: string): Promise<boolean> {
    return Promise.resolve(confirm(mensaje));
  }
}
