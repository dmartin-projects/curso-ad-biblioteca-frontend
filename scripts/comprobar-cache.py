"""Comprobación del módulo 52 en el navegador contra Django (ng serve + proxy)."""
import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    red = []
    pg.on("request", lambda r: "/api/" in r.url and red.append(f"{r.method} {r.url.split('/api/v1')[1]}"))
    cuenta = lambda pref: sum(1 for x in red if x.split(' ')[1].startswith(pref))

    pg.goto("http://localhost:4200/login")
    pg.fill("input[name=email]", "biblio@example.com"); pg.fill("input[name=password]", "clave-segura-123")
    pg.click("button[type=submit]"); pg.wait_for_selector("app-libro-card")
    pg.wait_for_selector("select.genero option:nth-child(2)", state="attached")
    pg.click("a:has-text('Administración')"); pg.wait_for_selector("ul.generos li")
    pg.click("a:has-text('Catálogo')"); pg.wait_for_selector("app-libro-card")
    print("1. Géneros (catálogo → admin → catálogo):", cuenta("/generos/"), "petición |",
          pg.locator("select.genero option").count() - 1, "géneros")

    # SWR: detalle A → "Siguiente libro" (B) → atrás (A otra vez)
    pg.locator("app-libro-card h3 a").first.click(); pg.wait_for_selector("app-detalle-libro h1")
    titulo_a = pg.inner_text("app-detalle-libro h1"); id_a = pg.url.rstrip("/").split("/")[-1]
    pg.click("a:has-text('Siguiente libro')"); pg.wait_for_function(f"!document.querySelector('app-detalle-libro h1')?.textContent.includes({titulo_a!r})")
    pg.evaluate("""() => { performance.clearResourceTimings(); window.__h2 = null;
      new MutationObserver(() => { const h = document.querySelector('app-detalle-libro h1');
        if (h && !window.__h2) window.__h2 = {t: performance.now(), texto: h.textContent.trim()}; })
        .observe(document.body, {subtree: true, childList: true, characterData: true}); }""")
    # retrasamos 1 s la respuesta de la API para ver qué se pinta mientras tanto
    pg.route(f"**/api/v1/libros/{id_a}/", lambda ruta: (time.sleep(1), ruta.continue_()))
    pg.go_back(); pg.wait_for_timeout(2000); pg.unroute(f"**/api/v1/libros/{id_a}/")
    r = pg.evaluate(f"""() => {{ const e = performance.getEntriesByType('resource').find(x => x.name.endsWith('/libros/{id_a}/'));
                             return {{h2: window.__h2, respuesta: e && e.responseEnd}}; }}""")
    print(f"2. SWR al volver: h2 «{r['h2']['texto']}» pintado a los {r['h2']['t']:.0f} ms; respuesta de la API a los {r['respuesta']:.0f} ms")

    pg.click("a:has-text('Mis préstamos')"); pg.wait_for_selector("app-listado-prestamos li")
    print("3. Préstamos:", pg.locator("app-listado-prestamos li").count(), "filas |", red[-1])
    pg.click("app-listado-prestamos button:has-text('Siguiente')"); pg.wait_for_timeout(800)
    print("   Siguiente →", red[-1][:60])
    n = len(red)
    pg.locator("app-listado-prestamos li button:has-text('Devolver')").first.click(); pg.wait_for_timeout(1200)
    print("   Devolver →", red[n:])
    n = len(red)
    pg.evaluate("window.dispatchEvent(new Event('visibilitychange'))"); pg.wait_for_timeout(500)
    print("   Volver a la pestaña antes de 30 s →", red[n:] or "nada (los datos aún son frescos: staleTime)")
    time.sleep(31)
    pg.evaluate("window.dispatchEvent(new Event('visibilitychange'))"); pg.wait_for_timeout(800)
    print("   Volver a la pestaña tras 31 s →", red[n:])
    b.close()
