/** Lo que hace el worker, en una función normal: así se puede probar y comparar. */
export interface VistaPrevia {
  total: number;
  porConcepto: Record<string, number>;
  muestra: string[][];
  errores: number;
}

export function parsearCsv(texto: string): VistaPrevia {
  const lineas = texto.split('\n').slice(1).filter(Boolean);
  const porConcepto: Record<string, number> = {};
  let errores = 0;
  const muestra: string[][] = [];
  for (const linea of lineas) {
    const [fecha, concepto, importeTexto] = linea.split(';');
    const importe = Number(importeTexto?.replace('.', '').replace(',', '.'));
    if (!fecha || Number.isNaN(Date.parse(fecha)) || Number.isNaN(importe)) {
      errores++;
      continue;
    }
    const clave = concepto
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
    porConcepto[clave] = (porConcepto[clave] ?? 0) + importe;
    if (muestra.length < 50) muestra.push([fecha, concepto, importeTexto]);
  }
  return { total: lineas.length, porConcepto, muestra, errores };
}

/** Un extracto de prueba: n líneas "fecha;concepto;importe". */
export function generarCsv(n: number): string {
  const conceptos = ['Mercadona', 'Nómina', 'Gasolinera', 'Luz', 'Amazon', 'Farmacia', 'Bizum'];
  const filas = ['fecha;concepto;importe'];
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.UTC(2026, 0, 1) + i * 60_000).toISOString().slice(0, 10);
    filas.push(
      `${d};${conceptos[i % conceptos.length]} ${i % 97};${((i * 37) % 20000) / 100},${i % 100}`,
    );
  }
  return filas.join('\n');
}
