"""Módulo 61: service worker, dataGroups sin conexión, limpieza en el logout y aviso de versión nueva.

Necesita Django en :8000 y dos builds de producción distintos (cualquier cambio de código):
    ng build && cp -r dist/frontend/browser /tmp/pwa-v1
    (cambia algo) && ng build && cp -r dist/frontend/browser /tmp/pwa-v2
    python3 scripts/comprobar-pwa.py /tmp/pwa-v1 /tmp/pwa-v2
"""
import os, subprocess, sys, tempfile, time
from playwright.sync_api import sync_playwright

v1, v2 = sys.argv[1:3]
actual = os.path.join(tempfile.mkdtemp(), "actual")
os.symlink(v1, actual)
PUERTO, B = "8767", "http://localhost:8767"
servidor = lambda: subprocess.Popen([sys.executable, "scripts/servidor_spa.py", actual, PUERTO, "http://localhost:8000"], stderr=subprocess.DEVNULL)
srv = servidor(); time.sleep(1.5)
cuantas = lambda pg: pg.evaluate("caches.keys().then(k => k.filter(n => n.includes(':data:') && n.endsWith(':cache')))")


def entrar(pg):
    pg.goto(B + "/login"); pg.wait_for_selector("input[type=email]")
    pg.fill("input[type=email]", "biblio@example.com"); pg.fill("input[type=password]", "clave-segura-123")
    pg.click("button[type=submit]"); pg.wait_for_selector("app-libro-card")


try:
    with sync_playwright() as p:
        b = p.chromium.launch(); ctx = b.new_context(); pg = ctx.new_page()
        entrar(pg)
        pg.wait_for_function("navigator.serviceWorker.getRegistration().then(r => r?.active?.state === 'activated')", timeout=40000)
        pg.reload(); pg.wait_for_selector("app-libro-card")
        print("1. Service worker activo y controlando la página:", pg.evaluate("!!navigator.serviceWorker.controller"))
        pg.click("a[href='/prestamos']"); pg.wait_for_selector("app-listado-prestamos li")
        n_online = pg.locator("app-listado-prestamos li").count()
        pg.click("a[href='/admin']"); pg.wait_for_selector(".generos li")
        print("2. Cachés de datos tras visitar préstamos y admin:", cuantas(pg))

        # se va la red CON la app abierta (el caso "metro"): token en memoria, el SW tiene los datos
        srv.terminate(); srv.wait(); ctx.set_offline(True)
        pg.wait_for_selector(".sin-conexion")
        print("3. Sin conexión, app abierta → banner:", pg.inner_text(".sin-conexion"))
        pg.click("a[href='/prestamos']"); pg.wait_for_timeout(5000)
        print("   /prestamos (freshness: red → 4 s → caché):", pg.locator("app-listado-prestamos li").count(), "de", n_online, "filas")
        pg.click("a[href='/catalogo']"); pg.wait_for_timeout(5000)
        print("   /catalogo (no cacheado):", pg.locator("[role=alert]").all_inner_texts() or pg.locator("app-libro-card").count())
        pg.reload(); pg.wait_for_timeout(5000)
        print("   recargar sin conexión → la app arranca (SW) pero:", pg.url.replace(B, ""), "| h1:", pg.inner_text("h1"))
        print("   ¿siguen los datos guardados? (el refresh falló por la red, no por la sesión):", cuantas(pg))

        srv = servidor(); time.sleep(1.5); ctx.set_offline(False)
        entrar(pg); pg.click("a[href='/prestamos']"); pg.wait_for_selector("app-listado-prestamos li"); pg.wait_for_timeout(500)
        print("4. Antes del logout:", cuantas(pg))
        pg.click("text=Salir"); pg.wait_for_selector("input[type=email]"); pg.wait_for_timeout(500)
        print("   Después del logout:", cuantas(pg) or "ninguna")

        os.remove(actual); os.symlink(v2, actual)  # se "despliega" la versión 2
        pg.goto(B + "/login"); pg.wait_for_selector("input[type=email]")
        pg.wait_for_selector("mat-snack-bar-container", timeout=30000)
        print("5. Versión nueva →", pg.inner_text("mat-snack-bar-container").replace("\n", " | "))
        # navegación DENTRO de la pestaña abierta (popstate, como el botón Atrás): sigue en la v1
        pg.evaluate("history.pushState({}, '', '/no-existe'); dispatchEvent(new PopStateEvent('popstate', { state: {} }))")
        pg.wait_for_selector("h1:has-text('Página no encontrada')")
        print("   la pestaña abierta sigue en la versión vieja → 404:", pg.inner_text("h1"))
        pg.click("mat-snack-bar-container button"); pg.wait_for_timeout(2000)
        print("   tras pulsar Actualizar (recarga) →", pg.inner_text("h1"))
        b.close()
finally:
    srv.terminate()
