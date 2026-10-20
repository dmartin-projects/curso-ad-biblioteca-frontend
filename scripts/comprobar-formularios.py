"""Comprobación del módulo 53 en el navegador contra Django: alta y edición de un libro."""
import random


def digito(doce: str) -> str:
    suma = sum(int(c) * (1 if i % 2 == 0 else 3) for i, c in enumerate(doce))
    return str((10 - suma % 10) % 10)
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    dialogos = []
    pg.on("dialog", lambda d: (dialogos.append(d.message), d.dismiss()))
    red = []
    pg.on("request", lambda r: "/api/v1/libros/" in r.url and red.append(f"{r.method} {r.url.split('/api/v1')[1]}"))
    errores = lambda: [e.inner_text().strip() for e in pg.locator(".error").all()]

    pg.goto("http://localhost:4200/login")
    pg.fill("input[type=email]", "no-es-un-email"); pg.locator("input[type=email]").blur()
    print("1. Login, email mal escrito →", errores())
    pg.fill("input[type=email]", "biblio@example.com"); pg.fill("input[type=password]", "clave-segura-123")
    pg.click("button[type=submit]"); pg.wait_for_selector("app-libro-card")
    isbn_existente = None
    pg.locator("app-libro-card h3 a").first.click(); pg.wait_for_selector("app-detalle-libro")
    isbn_existente = pg.inner_text("app-detalle-libro").split("ISBN ")[1].split()[0]

    pg.goto("http://localhost:4200/catalogo/nuevo")
    pg.wait_for_selector("[name='libro.titulo']", timeout=15000)
    pg.click("button[type=submit]"); pg.wait_for_selector(".error")
    print("2. Enviar vacío →", errores())
    pg.fill("[name='libro.titulo']", "Prueba del módulo 53")
    n = len(red)
    pg.fill("[name='libro.isbn']", isbn_existente); pg.locator("[name='libro.isbn']").blur()
    pg.wait_for_timeout(1200)
    print("3. ISBN existente →", [e for e in errores() if "ISBN" in e], "| peticiones:", red[n:])
    nuevo = "978" + "".join(random.choice("0123456789") for _ in range(10))
    pg.fill("[name='libro.isbn']", nuevo); pg.wait_for_timeout(1200)
    pg.fill(".buscar-autor", "herbert"); pg.wait_for_selector(".sugerencias button")
    pg.locator(".sugerencias button").first.click(); pg.wait_for_selector(".elegidos li")
    print("4. Autor elegido →", pg.inner_text(".elegidos").replace("✕", "").strip(), "| errores:", errores())
    pg.fill("[name='libro.publicado']", "2020-05-01")
    # un ISBN con el formato bien pero el dígito de control mal: solo lo detecta el servidor
    malo = nuevo[:-1] + str((int(nuevo[-1]) + 1) % 10) if nuevo[-1] == digito(nuevo[:-1]) else nuevo
    pg.fill("[name='libro.isbn']", malo); pg.wait_for_timeout(1000)
    pg.click("button[type=submit]"); pg.wait_for_selector("text=dígito de control")
    print("5. Error 400 del servidor, en su campo →", [e for e in errores() if "ISBN" in e])
    pg.fill("[name='libro.isbn']", nuevo[:-1] + digito(nuevo[:-1])); pg.wait_for_timeout(1000)
    pg.click("button[type=submit]"); pg.wait_for_selector("app-detalle-libro h1", timeout=15000)
    print("   Con un ISBN válido →", pg.url.replace("http://localhost:4200", ""), "|", pg.inner_text("app-detalle-libro h1"))

    pg.click("a:has-text('Editar')"); pg.wait_for_function("document.querySelector(\"[name='libro.titulo']\")?.value?.length > 0")
    pg.fill("[name='libro.titulo']", "Prueba del módulo 53 (editada)"); pg.wait_for_timeout(500)
    pg.click("button[type=submit]"); pg.wait_for_selector("app-detalle-libro h1")
    pg.wait_for_function("document.querySelector('app-detalle-libro h1').textContent.includes('editada')")
    print("6. Editado →", pg.inner_text("app-detalle-libro h1"), "| diálogos:", dialogos, "| PATCH:", [x for x in red if x.startswith("PATCH")])

    pg.click("a:has-text('Editar')"); pg.wait_for_function("document.querySelector(\"[name='libro.titulo']\")?.value?.length > 0")
    pg.fill("[name='libro.titulo']", "cambio sin guardar")
    pg.click("a:has-text('Catálogo')"); pg.wait_for_timeout(500)
    # el guard pregunta con Confirmaciones: confirm() nativo (módulo 50) o diálogo del CDK (módulo 55)
    if pg.locator("[role=alertdialog]").count():
        dialogos.append(pg.inner_text("[role=alertdialog] p")); pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    print("7. Salir con cambios →", dialogos[-1:], "| sigue en", pg.url.replace("http://localhost:4200", ""))

    pg.goto("http://localhost:4200/gastos/nuevo"); pg.wait_for_selector("app-nuevo-gasto fieldset.linea")
    pg.fill("app-nuevo-gasto fieldset.linea input >> nth=0", "Pan")
    pg.fill("app-nuevo-gasto fieldset.linea input >> nth=2", "1.5")
    pg.click("text=Añadir línea"); pg.fill("app-nuevo-gasto fieldset.linea >> nth=1 >> input >> nth=0", "Leche")
    pg.fill("app-nuevo-gasto fieldset.linea >> nth=1 >> input >> nth=2", "0.99")
    pg.fill("app-nuevo-gasto input >> nth=1", "Mercadona"); pg.click("app-selector-categoria label >> nth=0")
    pg.wait_for_timeout(200)
    print("8. Gasto →", pg.inner_text(".total"), "| categoría activa:", pg.inner_text("app-selector-categoria label:has(input:checked)"))
    pg.click("app-nuevo-gasto button[type=submit]"); pg.wait_for_selector(".aviso--exito")
    print("   Guardar →", pg.inner_text(".aviso--exito").replace("×", "").strip())
    b.close()
