"""Módulo 57 en el navegador (build de producción): @defer, AlVerse y web worker con INP."""
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

WEB_VITALS = Path("node_modules/web-vitals/dist/web-vitals.iife.js").read_text()
BASE = "http://localhost:8766"

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1280, "height": 600})
    js = []
    pg.on("request", lambda r: r.url.endswith(".js") and js.append(r.url.rsplit("/", 1)[-1]))
    for _ in range(3):
        pg.goto(f"{BASE}/login"); pg.wait_for_selector("input[type=email]")
        pg.fill("input[type=email]", "biblio@example.com"); pg.fill("input[type=password]", "clave-segura-123")
        pg.click("button[type=submit]"); pg.wait_for_selector("app-libro-card, [role=alert]")
        if pg.locator("app-libro-card").count(): break
        print("  (throttle)"); time.sleep(61)

    # @defer (on interaction; prefetch on idle): el chunk llega solo, ANTES del clic
    pg.wait_for_timeout(1500)
    antes = len(js)
    pg.click(".boton-filtros"); pg.wait_for_selector("app-filtros-avanzados")
    print("1. Filtros avanzados: chunks descargados al pulsar →", js[antes:] or "ninguno (ya estaban, prefetch on idle)")

    # @defer (on viewport): Chart.js solo cuando el gráfico se acerca a la pantalla
    pg.set_viewport_size({"width": 1280, "height": 300})  # pantalla baja: el gráfico queda "debajo del pliegue"
    pg.click("mat-nav-list a:has-text('Administración')"); pg.wait_for_selector("app-panel-prestamos li")
    antes = len(js); pg.wait_for_timeout(1000)
    print("2. Admin cargado: ¿gráfico pintado?", pg.locator("app-grafico canvas").count(), "| JS nuevo sin bajar:", len(js) - antes)
    pg.locator(".esqueleto-grafico").scroll_into_view_if_needed(); pg.wait_for_selector("app-grafico canvas")
    pg.set_viewport_size({"width": 1280, "height": 600})
    print("   al bajar → canvas:", pg.locator("app-grafico canvas").count(), "| JS descargado:", js[antes:])

    # AlVerse: scroll infinito con centinela
    pg.goto(f"{BASE}/prestamos/historial-simple"); pg.wait_for_selector(".fila")
    n0 = pg.locator(".fila").count()
    for _ in range(3):
        pg.mouse.move(800, 400); pg.mouse.wheel(0, 20000); pg.wait_for_timeout(800)
    print("3. Historial simple:", n0, "→", pg.locator(".fila").count(), "filas tras bajar 3 veces")

    # Web worker: INP (con la librería web-vitals) del clic en cada botón, en páginas nuevas
    for boton in ("#en-hilo", "#en-worker"):
        pg.goto(f"{BASE}/labs/importacion"); pg.wait_for_selector(boton)
        pg.evaluate(WEB_VITALS)
        pg.evaluate("""() => { window.__inp = null;
            webVitals.onINP((m) => window.__inp = Math.round(m.value), { reportAllChanges: true, durationThreshold: 0 }); }""")
        t = time.perf_counter(); pg.click(boton)
        pg.wait_for_function("document.querySelector('.estado')?.textContent.startsWith('Hecho')", timeout=60000)
        total = (time.perf_counter() - t) * 1000
        pg.wait_for_timeout(300)
        print(f"4. {boton:11} → INP {pg.evaluate('window.__inp')} ms | resultado listo en {total:.0f} ms |", pg.inner_text(".resultado"))
    b.close()
