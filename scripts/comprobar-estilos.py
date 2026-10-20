"""Módulo 56 en el navegador: Tailwind, layout con MatSidenav, container queries y modo oscuro."""
import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1280, "height": 800}); pg = ctx.new_page()
    for _ in range(3):
        pg.goto("http://localhost:4200/login"); pg.wait_for_selector("input[type=email]")
        pg.fill("input[type=email]", "biblio@example.com"); pg.fill("input[type=password]", "clave-segura-123")
        pg.click("button[type=submit]")
        try:
            pg.wait_for_selector("app-libro-card, [role=alert]", timeout=15000)
        except Exception:
            print("  (recarga de Vite al optimizar dependencias; otra vez)"); continue
        if pg.locator("app-libro-card").count(): break
        print("  (throttle, esperando)"); time.sleep(61)

    estilo = lambda sel, prop: pg.eval_on_selector(sel, f"e => getComputedStyle(e).{prop}")
    print("1. Tailwind en la plantilla: main max-width", estilo("main", "maxWidth"), "| cabecera position", estilo("header", "position"))
    print("2. Escritorio (1280 px): sidenav", pg.get_attribute("mat-sidenav", "class").split()[-1] if False else
          ("side, abierto" if pg.locator("mat-sidenav.mat-drawer-side.mat-drawer-opened").count() else "?"),
          "| botón ☰:", pg.locator("button[aria-label='Abrir el menú']").count())
    tarjetas = pg.locator("app-libro-card")
    print("3. Rejilla:", len(set(round(tarjetas.nth(i).bounding_box()["x"]) for i in range(min(6, tarjetas.count())))), "columnas |",
          "tarjeta", round(tarjetas.first.bounding_box()["width"]), "px → display", estilo("app-libro-card .contenido", "display"))

    pg.set_viewport_size({"width": 390, "height": 800}); pg.wait_for_timeout(500)
    print("4. Móvil (390 px): sidenav abierto:", pg.locator("mat-sidenav.mat-drawer-opened").count(), "| modo over:", pg.locator("mat-sidenav.mat-drawer-over").count(),
          "| botón ☰:", pg.locator("button[aria-label='Abrir el menú']").count())
    pg.click("button[aria-label='Abrir el menú']"); pg.wait_for_timeout(500)
    print("   ☰ → abierto:", pg.locator("mat-sidenav.mat-drawer-opened").count())
    pg.click("mat-nav-list a:has-text('Gastos')"); pg.wait_for_timeout(500)
    print("   elegir 'Gastos' → se cierra:", pg.locator("mat-sidenav.mat-drawer-opened").count() == 0, "|", pg.url.split("4200")[1])

    pg.set_viewport_size({"width": 520, "height": 800}); pg.goto("http://localhost:4200/catalogo"); pg.wait_for_selector("app-libro-card")
    pg.wait_for_timeout(300)
    print("5. 520 px (menú encima, 1 columna ancha): tarjeta", round(tarjetas.first.bounding_box()["width"]), "px → display", estilo("app-libro-card .contenido", "display"),
          "(container query: ≥ 24rem = 384 px de contenido)")

    pg.goto("http://localhost:4200/labs/movimientos"); pg.click("#modo-virtual"); pg.wait_for_selector(".importe.negativo")
    color = lambda: (estilo(".importe:not(.negativo)", "color"), estilo(".importe.negativo", "color"), estilo("body", "backgroundColor"))
    print("6. Tokens light-dark(): claro (ingreso, gasto, fondo) =", color())
    pg.emulate_media(color_scheme="dark"); pg.wait_for_timeout(100)
    print("                          oscuro =", color())
    b.close()
