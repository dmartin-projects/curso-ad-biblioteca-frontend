"""Ejercicio 7 del módulo 50. Uso:
  ng build --verbose | grep chunk- > /tmp/build50.txt
  python3 scripts/servidor_spa.py dist/frontend/browser 8766 &
  python3 scripts/comprobar-rutas.py
"""
import json, re
from playwright.sync_api import sync_playwright
nombres = {}
for linea in open('/tmp/build50.txt'):
    m = re.match(r'(chunk-\S+\.js)\s+\|\s+(\S+)', linea)
    if m and m.group(2) != '-': nombres[m.group(1)] = m.group(2)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    js = []
    pg.on("request", lambda r: r.url.endswith('.js') and js.append(r.url.rsplit('/', 1)[-1]))
    pg.route("**/api/v1/libros/1/", lambda r: r.fulfill(json={"id": 1, "titulo": "Dune", "isbn": "9780441172719", "autores": ["Frank Herbert"], "publicado": "1965-08-01", "ejemplares_disponibles": 2}))
    pg.add_init_script("""
      window.__vt = 0;
      const orig = document.startViewTransition?.bind(document);
      if (orig) document.startViewTransition = (cb) => { window.__vt++; return orig(cb); };
    """)
    pg.goto("http://localhost:8766/catalogo"); pg.wait_for_selector("#lector")
    print("URL:", pg.url, "| título:", pg.title())
    pg.wait_for_timeout(1500)
    print("Tras arrancar en /login:", [nombres.get(j, j) for j in js])
    n = len(js)
    pg.click("#lector"); pg.wait_for_selector("app-libro-card"); pg.wait_for_timeout(1000)
    print("Tras entrar:", [nombres.get(j, j) for j in js[n:]], "| URL:", pg.url, "| título:", pg.title())
    n = len(js)
    pg.click("app-libro-card h3 a"); pg.wait_for_selector("app-detalle-libro h1"); pg.wait_for_timeout(300)
    print("Al abrir el detalle:", [nombres.get(j, j) for j in js[n:]], "| título:", pg.title(), "| view transitions:", pg.evaluate("window.__vt"))
    print("view-transition-name del h1:", pg.eval_on_selector("app-detalle-libro h1", "e => getComputedStyle(e).viewTransitionName"))
    b.close()
