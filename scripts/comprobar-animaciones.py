"""Módulo 59: animate.enter / animate.leave y prefers-reduced-motion (Django :8000, ng serve :4200)."""
from playwright.sync_api import sync_playwright

BASE = "http://localhost:4200"

with sync_playwright() as p:
    b = p.chromium.launch()
    for movimiento in ("no-preference", "reduce"):
        pg = b.new_page(reduced_motion=movimiento)
        pg.goto(f"{BASE}/login"); pg.wait_for_selector("input[type=email]")
        pg.fill("input[type=email]", "biblio@example.com"); pg.fill("input[type=password]", "clave-segura-123")
        pg.click("button[type=submit]"); pg.wait_for_selector("app-libro-card")
        print(f"── prefers-reduced-motion: {movimiento}")

        # panel de filtros: entra con .entrando; al cerrarlo, .saliendo y Angular ESPERA para quitarlo
        pg.click(".boton-filtros"); pg.wait_for_selector(".panel-filtros")
        print("   filtros abiertos → clases:", pg.get_attribute(".panel-filtros", "class"))
        pg.wait_for_timeout(400)
        print("   400 ms después    → clases:", pg.get_attribute(".panel-filtros", "class"))
        pg.click(".boton-filtros"); pg.wait_for_timeout(50)
        print("   cerrar, +50 ms    → ¿sigue en el DOM?", pg.locator(".panel-filtros").count(), "| clases:",
              pg.get_attribute(".panel-filtros", "class") if pg.locator(".panel-filtros").count() else "—")
        pg.wait_for_timeout(400)
        print("   cerrar, +450 ms   → ¿sigue en el DOM?", pg.locator(".panel-filtros").count())

        # avisos (toasts)
        pg.goto(f"{BASE}/gastos/nuevo"); pg.wait_for_selector("form")
        pg.fill("label:has-text('Comercio') input", "Mercadona")
        pg.click("label:has-text('Súper')")
        pg.fill("label:has-text('Descripción') input", "Pan")
        pg.fill("label:has-text('Precio') input", "1.20")
        pg.click("button[type=submit]"); pg.wait_for_selector(".aviso")
        print("   aviso nuevo       →", pg.get_attribute(".aviso", "class"), "|", pg.inner_text(".aviso").split("\n")[0])
        pg.wait_for_timeout(300)
        pg.click(".aviso button"); pg.wait_for_timeout(40)
        print("   cerrar aviso +40ms → en el DOM:", pg.locator(".aviso").count(),
              "| clases:", pg.get_attribute(".aviso", "class") if pg.locator(".aviso").count() else "—")
        pg.wait_for_timeout(300)
        print("   cerrar aviso +340ms → en el DOM:", pg.locator(".aviso").count())
        pg.close()
    b.close()
