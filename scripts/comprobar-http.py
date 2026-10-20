"""Comprobación de extremo a extremo del módulo 51. Requiere Django en :8000 (con datos de `seed` y el usuario biblio@example.com), el S3 local (RustFS, o uno simulado) y `ng serve`."""
import json, subprocess, urllib.request
from playwright.sync_api import sync_playwright

API = "http://localhost:8000/api/v1"
def api(metodo, ruta, token=None, datos=None):
    req = urllib.request.Request(API + ruta, method=metodo, data=json.dumps(datos).encode() if datos else None,
                                 headers={"Content-Type": "application/json", **({"Authorization": f"Bearer {token}"} if token else {})})
    with urllib.request.urlopen(req) as r:
        cuerpo = r.read()
        return json.loads(cuerpo) if cuerpo else None

with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(accept_downloads=True); pg = ctx.new_page()
    peticiones = []
    pg.on("request", lambda r: "/api/" in r.url and peticiones.append(f"{r.method} {r.url.split('/api/v1')[1].split('?')[0]}"))
    pg.on("pageerror", lambda e: print("  ⚠ error en la página:", e))

    pg.goto("http://localhost:4200/catalogo"); pg.wait_for_selector("input[name=email]")
    print("1. Sin sesión →", pg.url.replace("http://localhost:4200", ""))

    pg.fill("input[name=email]", "biblio@example.com"); pg.fill("input[name=password]", "mala")
    pg.click("button[type=submit]"); pg.wait_for_selector("[role=alert]")
    print("2. Contraseña mala →", pg.inner_text("[role=alert]"))

    pg.fill("input[name=password]", "clave-segura-123"); pg.click("button[type=submit]")
    pg.wait_for_selector("app-libro-card")
    print("3. Login →", pg.url.replace("http://localhost:4200", ""), "|", pg.inner_text(".contador"), "|", pg.locator("app-libro-card").count(), "tarjetas |", pg.inner_text(".usuario"))

    primera = max(pg.inner_text("app-libro-card h3").split(), key=len)
    pg.fill("input[type=search]", primera); pg.wait_for_timeout(800)
    print(f"4. Buscar '{primera}' →", pg.url.replace("http://localhost:4200", ""), "|", pg.inner_text(".contador"))

    peticiones.clear()
    pg.reload(); pg.wait_for_selector("app-libro-card")
    print("5. Recargar →", pg.url.replace("http://localhost:4200", ""), "| peticiones:", peticiones[:3])

    # access caducado (simulado): ponemos un token inválido y forzamos una petición
    pg.evaluate("""() => { const a = ng.getComponent(document.querySelector('app-layout-privado')).auth;
                           a.establecerSesion('token-caducado', a.usuario()); }""")
    peticiones.clear()
    pg.click("app-paginador button:has-text('Siguiente')"); pg.wait_for_timeout(1000)
    print("6. Access caducado →", peticiones, "| sigue en", pg.url.replace("http://localhost:4200", ""))

    pg.click("app-libro-card h3 a"); pg.wait_for_selector("app-detalle-libro h1")
    print("7. Detalle →", pg.inner_text("app-detalle-libro h1"), "|", pg.title())
    progresos = []
    pg.expose_function("anotar", lambda v: progresos.append(v))
    pg.evaluate("""() => new MutationObserver(() => { const p = document.querySelector('app-subir-portada progress');
                     if (p) anotar(p.value); }).observe(document.body, {subtree: true, childList: true, attributes: true})""")
    pg.set_input_files("app-subir-portada input[type=file]", "/tmp/portada.png")
    pg.wait_for_selector("img.portada, app-subir-portada [role=alert]")
    if pg.locator("app-subir-portada [role=alert]").count(): print("  ⚠", pg.inner_text("app-subir-portada [role=alert]"))
    print("8. Portada subida →", pg.get_attribute("img.portada", "src"), "| progreso visto:", sorted(set(progresos))[:6])

    pg.click("a:has-text('Administración')"); pg.wait_for_selector("#exportar-prestamos")
    with pg.expect_download() as d:
        pg.click("#exportar-prestamos")
    ruta = d.value.path()
    print("9. CSV →", d.value.suggested_filename, "|", open(ruta).readline().strip(), "|", sum(1 for _ in open(ruta)), "líneas")

    token = api("POST", "/auth/login/", datos={"email": "biblio@example.com", "password": "clave-segura-123"})["access"]
    activo = next(x for x in api("GET", "/prestamos/?estado=activo", token)["results"])
    api("POST", f"/prestamos/{activo['id']}/devolver/", token)
    pg.wait_for_selector(".aviso--info", timeout=5000)
    print("10. WebSocket →", pg.inner_text(".aviso--info").replace("×", "").strip())

    pg.click("button:has-text('Salir')"); pg.wait_for_selector("input[name=email]")
    pg.goto("http://localhost:4200/catalogo"); pg.wait_for_selector("input[name=email]")
    print("11. Salir y recargar →", pg.url.replace("http://localhost:4200", ""))
    b.close()
