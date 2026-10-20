"""Módulo 59: axe-core en las pantallas principales + recorrido con teclado (Django :8000, ng serve :4200)."""
import sys, time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:4200"
AXE = "node_modules/axe-core/axe.min.js"
PAGINAS = ["/catalogo", "/catalogo/libros/9771", "/catalogo/tabla", "/gastos/nuevo", "/gastos", "/prestamos", "/admin"]


def axe(pg):
    pg.add_script_tag(path=AXE)
    r = pg.evaluate("axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] })")
    return [(v["impact"], v["id"], len(v["nodes"]), v["nodes"][0]["target"][0]) for v in r["violations"]]


with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1280, "height": 900})
    pg.goto(f"{BASE}/login"); pg.wait_for_selector("input[type=email]")
    print("/login →", axe(pg) or "sin problemas")
    for intento in range(3):
        pg.fill("input[type=email]", "biblio@example.com"); pg.fill("input[type=password]", "clave-segura-123")
        pg.click("button[type=submit]"); pg.wait_for_selector("app-libro-card, [role=alert]")
        if pg.locator("app-libro-card").count(): break
        time.sleep(61); pg.goto(f"{BASE}/login"); pg.wait_for_selector("input[type=email]")

    for ruta in PAGINAS:
        pg.goto(BASE + ruta); pg.wait_for_load_state("networkidle"); pg.wait_for_timeout(500)
        problemas = axe(pg)
        print(f"{ruta} →", "sin problemas" if not problemas else "")
        for impacto, regla, n, ejemplo in problemas:
            print(f"   {impacto:9} {regla:28} ×{n:<3} p. ej. {ejemplo}")

    pg.emulate_media(color_scheme="dark")
    for ruta in ("/catalogo", "/gastos/nuevo"):
        pg.goto(BASE + ruta); pg.wait_for_load_state("networkidle"); pg.wait_for_timeout(500)
        print(f"{ruta} (modo oscuro) →", axe(pg) or "sin problemas")
    pg.emulate_media(color_scheme="light")

    activo = lambda: pg.evaluate("(e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : ''))(document.activeElement)")
    pg.goto(f"{BASE}/gastos"); pg.wait_for_selector("h1")
    pg.keyboard.press("Tab"); print("\nFoco:\n  1er Tab en /gastos →", activo(), "«" + pg.evaluate("document.activeElement.textContent.trim()") + "»")
    pg.keyboard.press("Enter"); print("  Enter en el enlace →", activo())
    pg.click("a[href='/catalogo']"); pg.wait_for_selector("app-libro-card"); pg.wait_for_timeout(300)
    print("  tras navegar con el menú →", activo())
    pg.fill("app-filtros-libros input[type=search]", "dun"); pg.wait_for_timeout(1200)
    print("  escribiendo en el buscador (cambia ?search=) →", activo(), "| URL:", pg.url.split("4200")[1])
    pg.goto(f"{BASE}/gastos/nuevo"); pg.wait_for_selector("form")
    pg.click("button[type=submit]"); pg.wait_for_timeout(300)
    print("  Guardar con el formulario vacío →", activo(), "| aria-invalid:", pg.get_attribute("input:focus", "aria-invalid"),
          "| descrito por:", pg.evaluate("document.getElementById(document.activeElement.getAttribute('aria-describedby'))?.textContent"))

    if "--teclado" in sys.argv:
        pg.goto(f"{BASE}/catalogo"); pg.wait_for_selector("app-libro-card")
        print("\nTab desde el principio de /catalogo:")
        for i in range(25):
            pg.keyboard.press("Tab")
            print(f"  {i + 1:2}.", pg.evaluate("""() => { const e = document.activeElement;
              const t = (e.getAttribute('aria-label') || e.textContent || e.value || '').trim().replace(/\\s+/g, ' ');
              return e.tagName.toLowerCase() + (e.getAttribute('role') ? '[' + e.getAttribute('role') + ']' : '') + ' «' + t.slice(0, 40) + '»'; }"""))
    b.close()
