import { destinoSeguro } from './destino';

const ORIGEN = 'https://biblioteca.example';

describe('destinoSeguro (?next= del login)', () => {
  it.each([
    ['/prestamos', '/prestamos'],
    ['/catalogo?search=dune&page=2', '/catalogo?search=dune&page=2'],
    ['/catalogo/libros/7#resenas', '/catalogo/libros/7#resenas'],
    [`${ORIGEN}/prestamos`, '/prestamos'], // absoluta pero nuestra: vale
  ])('acepta %s', (next, esperado) => {
    expect(destinoSeguro(next, ORIGEN)).toBe(esperado);
  });

  it.each([
    'https://malicioso.com',
    '//malicioso.com',
    '/\\malicioso.com',
    '/\t/malicioso.com', // el tabulador desaparece: "//malicioso.com"
    '/\n/malicioso.com',
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'http://biblioteca.example/prestamos', // http ≠ https: otro origen
    '',
    null,
    undefined,
  ])('rechaza %j y va al catálogo', (next) => {
    expect(destinoSeguro(next, ORIGEN)).toBe('/catalogo');
  });
});
