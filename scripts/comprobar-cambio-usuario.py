"""Módulo 54: cambiar de usuario en el mismo navegador no debe dejar ver datos del anterior."""
from playwright.sync_api import sync_playwright

def entrar(pg, email, clave):
    pg.goto("http://localhost:4200/login"); pg.wait_for_selector("input[type=email]")
    pg.fill("input[type=email]", email); pg.fill("input[type=password]", clave)
    pg.click("button[type=submit]"); pg.wait_for_selector("app-libro-card")

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    entrar(pg, "biblio@example.com", "clave-segura-123")
    pg.click("a:has-text('Gastos')"); pg.wait_for_selector("app-listado-gastos li")
    pg.select_option("app-selector-hogar select", "2"); pg.wait_for_timeout(300)
    print("1. Biblio, hogar →", pg.inner_text(".hogar-activo"), "| gastos:", pg.locator("app-listado-gastos li").all_inner_texts(),
          "| localStorage:", pg.evaluate("localStorage.getItem('hogarActivo')"))
    pg.click("a:has-text('Administración')"); pg.wait_for_selector("app-panel-prestamos li")
    print("2. Panel préstamos (NgRx) →", pg.locator("app-panel-prestamos li").count(), "filas |", pg.inner_text("app-panel-prestamos h2"))
    pg.click("a:has-text('Mis préstamos')"); pg.wait_for_selector("app-listado-prestamos li")
    biblio = pg.locator("app-listado-prestamos li").all_inner_texts()[:3]
    print("3. Mis préstamos (TanStack) de biblio →", len(pg.locator("app-listado-prestamos li").all_inner_texts()), "filas")

    pg.click("button:has-text('Salir')"); pg.wait_for_selector("input[type=email]")
    print("4. Tras salir, localStorage:", repr(pg.evaluate("localStorage.getItem('hogarActivo')")))
    pg.fill("input[type=email]", "socio1@example.com"); pg.fill("input[type=password]", "demo1234")
    pg.click("button[type=submit]"); pg.wait_for_selector("app-libro-card")
    print("5. Socio: ¿enlace de administración?", pg.locator("a:has-text('Administración')").count())
    pg.click("a:has-text('Mis préstamos')"); pg.wait_for_timeout(150)
    al_entrar = pg.locator("app-listado-prestamos li").all_inner_texts()[:3]
    print("6. Mis préstamos del socio, al instante →", "¡LOS DE BIBLIO!" if al_entrar[:3] == biblio and biblio else al_entrar)
    pg.wait_for_timeout(1500)
    print("   un momento después →", pg.locator("app-listado-prestamos li").all_inner_texts()[:2])
    pg.click("a:has-text('Gastos')"); pg.wait_for_selector(".hogar-activo")
    pg.wait_for_timeout(300)
    print("7. Socio, hogar →", pg.inner_text(".hogar-activo"))
    b.close()
