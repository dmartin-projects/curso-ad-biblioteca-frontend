import { generarCsv, parsearCsv } from './parsear';

describe('parsearCsv (lo que ejecuta el web worker)', () => {
  it('cuenta filas, agrupa por concepto (sin acentos ni mayúsculas) y separa los errores', () => {
    const csv = [
      'fecha;concepto;importe',
      '2026-01-01;Nómina;1.850,00',
      '2026-01-02;nomina;10,5',
      'mal;x;y',
    ].join('\n');
    expect(parsearCsv(csv)).toEqual({
      total: 3,
      porConcepto: { nomina: 1860.5 },
      muestra: [
        ['2026-01-01', 'Nómina', '1.850,00'],
        ['2026-01-02', 'nomina', '10,5'],
      ],
      errores: 1,
    });
  });

  it('el extracto de prueba se parsea sin errores', () => {
    const v = parsearCsv(generarCsv(1000));
    expect([v.total, v.errores]).toEqual([1000, 0]);
  });
});
