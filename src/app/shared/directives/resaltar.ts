import { computed, Directive, input } from '@angular/core';

const DIACRITICOS = /\p{Diacritic}/gu;

function escaparHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

/** Rangos [inicio, fin) del texto ORIGINAL donde aparece el término, sin mirar acentos ni
 * mayúsculas: "garcia" marca "García" (igual que filtra el catálogo). */
export function coincidencias(texto: string, termino: string): [number, number][] {
  const buscar = termino.normalize('NFD').replace(DIACRITICOS, '').toLowerCase();
  if (!buscar) return [];
  let normalizado = '';
  const origen: number[] = []; // posición en `texto` de cada carácter de `normalizado`
  for (let i = 0; i < texto.length; i++) {
    for (const c of texto[i].normalize('NFD').replace(DIACRITICOS, '').toLowerCase()) {
      normalizado += c;
      origen.push(i);
    }
  }
  const rangos: [number, number][] = [];
  for (let i = normalizado.indexOf(buscar); i !== -1; i = normalizado.indexOf(buscar, i + 1)) {
    rangos.push([origen[i], origen[i + buscar.length - 1] + 1]);
    i += buscar.length - 1; // sin solapes
  }
  return rangos;
}

@Directive({
  selector: '[appResaltar]',
  host: { '[innerHTML]': 'html()' },
})
export class Resaltar {
  readonly texto = input.required<string>({ alias: 'appResaltar' });
  readonly termino = input('');

  protected readonly html = computed(() => {
    const texto = this.texto();
    let html = '';
    let desde = 0;
    for (const [inicio, fin] of coincidencias(texto, this.termino().trim())) {
      // 🔐 todo lo que viene del usuario se escapa; solo <mark> es nuestro
      html +=
        escaparHtml(texto.slice(desde, inicio)) +
        `<mark>${escaparHtml(texto.slice(inicio, fin))}</mark>`;
      desde = fin;
    }
    return html + escaparHtml(texto.slice(desde));
  });
}
