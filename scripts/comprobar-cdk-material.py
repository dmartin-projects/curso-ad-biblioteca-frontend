"""Módulo 55 en el navegador: tema, virtual scroll, scroll infinito, tabla, drag and drop y diálogo."""
import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(color_scheme="light"); pg = ctx.new_page()
    cabeceras = {}
    pg.on("request", lambda r: "/api/v1/prestamos/" in r.url and cabeceras.setdefault(r.url.split("/api/v1")[1], r.headers.get("authorization", "SIN TOKEN")[:12]))
    for intento in range(3):
        pg.goto("http://localhost:4200/login"); pg.wait_for_selector("input[type=email]")
        pg.fill("input[type=email]", "biblio@example.com"); pg.fill("input[type=password]", "clave-segura-123")
        pg.click("button[type=submit]"); pg.wait_for_selector("app-libro-card, [role=alert]")
        if pg.locator("app-libro-card").count(): break
        print("   (login:", pg.inner_text("[role=alert]"), "→ esperando al throttle)"); time.sleep(61)

    fondo = lambda: pg.evaluate("getComputedStyle(document.body).backgroundColor")
    claro = fondo(); pg.emulate_media(color_scheme="dark"); oscuro = fondo(); pg.emulate_media(color_scheme="light")
    print("1. Tema: fondo claro", claro, "| oscuro", oscuro, "| primario", pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--mat-sys-primary')"))

    cdp = ctx.new_cdp_session(pg); cdp.send("Performance.enable")
    nodos = lambda: int({m["name"]: m["value"] for m in cdp.send("Performance.getMetrics")["metrics"]}["Nodes"])
    for modo in ("for", "virtual"):
        pg.goto("http://localhost:4200/labs/movimientos"); pg.wait_for_selector("#modo-for")
        cdp.send("HeapProfiler.collectGarbage"); base = nodos()
        t = time.perf_counter(); pg.click(f"#modo-{modo}"); pg.wait_for_selector(".fila"); pg.wait_for_timeout(50)
        ms = (time.perf_counter() - t) * 1000
        cdp.send("HeapProfiler.collectGarbage")
        print(f"2. {modo:7}: {pg.locator('.fila').count():5} filas en el DOM | nodos DOM +{nodos() - base:6} | {ms:5.0f} ms hasta pintar")
    pg.evaluate("document.querySelector('cdk-virtual-scroll-viewport').scrollTop = 1e7"); pg.wait_for_timeout(300)
    print("   tras desplazarse al final:", pg.locator(".fila").first.inner_text().split("\n")[1], "… (siguen", pg.locator(".fila").count(), "filas)")

    pg.goto("http://localhost:4200/prestamos/historial")
    pg.wait_for_function("/^[1-9]/.test(document.querySelector('.contador')?.textContent ?? '')")
    print("3. Historial:", pg.inner_text(".contador"))
    for _ in range(3):
        pg.evaluate("document.querySelector('cdk-virtual-scroll-viewport').scrollTop = 1e7"); pg.wait_for_timeout(700)
    print("   tras bajar 3 veces:", pg.inner_text(".contador"), "| peticiones y su Authorization:", list(cabeceras.items())[:4])

    pg.goto("http://localhost:4200/catalogo/tabla"); pg.wait_for_selector("tr.mat-mdc-row")
    pg.click("th:has-text('Publicado') .mat-sort-header-container"); pg.wait_for_timeout(800)
    pg.click("th:has-text('Publicado') .mat-sort-header-container"); pg.wait_for_timeout(800)
    pg.click(".mat-mdc-paginator-navigation-next"); pg.wait_for_timeout(800)
    print("4. Tabla →", pg.url.replace("http://localhost:4200", ""), "|", pg.inner_text(".mat-mdc-paginator-range-label"),
          "| primera fila:", pg.inner_text("tr.mat-mdc-row td:nth-child(3)"))

    pg.goto("http://localhost:4200/gastos"); pg.wait_for_selector("app-orden-categorias li")
    origen = pg.locator("app-orden-categorias li [cdkDragHandle]").nth(0).bounding_box()
    destino = pg.locator("app-orden-categorias li").nth(2).bounding_box()
    pg.mouse.move(origen["x"] + 5, origen["y"] + 5); pg.mouse.down()
    for i in range(1, 16):
        pg.mouse.move(origen["x"] + 5, origen["y"] + 5 + (destino["y"] + destino["height"] - origen["y"]) * i / 15); pg.wait_for_timeout(20)
    pg.mouse.up(); pg.wait_for_timeout(300)
    print("5. Arrastrar 'Súper' al final →", pg.locator("app-orden-categorias .nombre").all_inner_texts())
    pg.focus("[aria-label='Subir Súper']"); pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
    print("   y con teclado (Subir Súper + Enter) →", pg.locator("app-orden-categorias .nombre").all_inner_texts())

    pg.wait_for_selector("app-listado-gastos li")
    antes = pg.locator("app-listado-gastos li").count()
    pg.click("app-listado-gastos .borrar"); pg.wait_for_selector("app-confirmar")
    print("6. Diálogo:", pg.get_attribute("cdk-dialog-container", "role"), "| foco en:", pg.evaluate("document.activeElement.textContent.trim()"),
          "| <app-root aria-hidden>:", pg.get_attribute("app-root", "aria-hidden"))
    pg.keyboard.press("Tab"); foco2 = pg.evaluate("document.activeElement.textContent.trim()")
    pg.keyboard.press("Tab"); foco3 = pg.evaluate("document.activeElement.textContent.trim()")
    print("   Tab, Tab → el foco no sale del diálogo:", foco2, "→", foco3)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    print("   Escape → cerrado:", pg.locator("app-confirmar").count() == 0, "| foco vuelve a:", pg.evaluate("document.activeElement.textContent.trim()"), "| filas:", pg.locator("app-listado-gastos li").count(), "de", antes)
    pg.click("app-listado-gastos .borrar"); pg.click("app-confirmar .confirmar"); pg.wait_for_timeout(500)
    print("   Confirmar → filas:", pg.locator("app-listado-gastos li").count())
    b.close()
