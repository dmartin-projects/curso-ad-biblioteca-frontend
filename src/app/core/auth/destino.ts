/**
 * ¿A dónde ir tras el login? Solo a una ruta de NUESTRA aplicación.
 *
 * No basta con mirar el texto ("empieza por / y no por //"): los navegadores quitan tabuladores y
 * saltos de línea de las URL, así que "/\t/malicioso.com" pasa ese filtro y location.href lo
 * convierte en "//malicioso.com". Mejor dejar que el analizador de URL del navegador decida y
 * comparar el origen.
 */
export function destinoSeguro(
  next: string | null | undefined,
  origen = globalThis.location?.origin ?? 'http://localhost',
  porDefecto = '/catalogo',
): string {
  if (!next) return porDefecto;
  let url: URL;
  try {
    url = new URL(next, origen);
  } catch {
    return porDefecto;
  }
  if (url.origin !== origen) return porDefecto; // otro dominio, javascript:, data:…
  return url.pathname + url.search + url.hash; // siempre relativa: "/prestamos?page=2"
}
