"""Requiere `ng serve` (puerto 4200) y `pip install playwright`. Ejercicio 4 sin extensión: usa el mismo gancho que Angular DevTools (ng.ɵsetProfiler, solo en desarrollo)."""
from playwright.sync_api import sync_playwright
from collections import Counter
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    pg.goto("http://localhost:4200/catalogo"); pg.wait_for_selector("app-libro-card")
    pg.evaluate("""() => {
      window.__revisados = [];
      ng.ɵsetProfiler((evento, instancia) => {
        if (evento === 2 /* TemplateUpdateStart */ && instancia) window.__revisados.push(instancia.constructor.name);
      });
    }""")
    def medir(accion, etiqueta):
        pg.evaluate("window.__revisados = []")
        accion(); pg.wait_for_timeout(150)
        print(etiqueta, dict(Counter(n.lstrip("_") for n in pg.evaluate("window.__revisados") if n.startswith("_"))))  # solo componentes
    medir(lambda: pg.type("input[type=search]", "d"), "Escribir 'd' en el buscador:")
    medir(lambda: pg.type("input[type=search]", "u"), "Escribir 'u':                 ")
    medir(lambda: pg.click("app-libro-card button"), "Reservar un libro:           ")
    medir(lambda: pg.click("button:has-text('Entrar como bibliotecario')"), "Iniciar sesión:              ")
    b.close()
