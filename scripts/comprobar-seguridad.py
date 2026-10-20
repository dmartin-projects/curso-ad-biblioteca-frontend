"""Módulo 60: XSS en la sinopsis (Markdown saneado), ?next= del login y la CSP de autoCsp.
Django :8000 y ng serve :4200; para la CSP, el build servido con servidor_spa.py en :8766."""
import json, re, sys, time, urllib.error, urllib.parse, urllib.request
from playwright.sync_api import sync_playwright

API = "http://localhost:8000/api/v1"
ATAQUE = "**Dune**, de _Frank Herbert_.\n\n<img src=x onerror=\"alert('XSS')\"> [truco](javascript:alert('XSS'))"


def api(metodo, ruta, token=None, datos=None):
    r = urllib.request.Request(API + ruta, method=metodo, data=json.dumps(datos).encode() if datos else None,
                               headers={"Content-Type": "application/json", **({"Authorization": f"Bearer {token}"} if token else {})})
    return json.load(urllib.request.urlopen(r))


def entrar(pg, base, nxt=None):
    """El login admite 5 intentos por minuto (módulo 36): si salta el límite, espera y repite."""
    for _ in range(3):
        pg.goto(f"{base}/login" + (f"?next={urllib.parse.quote(nxt, safe='')}" if nxt else "")); pg.wait_for_selector("input[type=email]")
        pg.fill("input[type=email]", "biblio@example.com"); pg.fill("input[type=password]", "clave-segura-123")
        pg.click("button[type=submit]"); pg.wait_for_timeout(2000)
        alerta = pg.locator("[role=alert]")
        if "/login" not in pg.url or not alerta.count():
            return
        print("   (", alerta.inner_text(), "→ esperando 61 s )"); time.sleep(61)


for _ in range(3):
    try:
        token = api("POST", "/auth/login/", datos={"email": "biblio@example.com", "password": "clave-segura-123"})["access"]
        break
    except urllib.error.HTTPError as e:
        if e.code != 429: raise
        print("   (límite de logins → esperando 61 s)"); time.sleep(61)
libro = api("GET", "/libros/?page_size=1", token)["results"][0]["id"]
original = api("GET", f"/libros/{libro}/", token)["sinopsis"]
api("PATCH", f"/libros/{libro}/", token, {"sinopsis": ATAQUE})
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(); dialogos, consola = [], []
        pg.on("dialog", lambda d: (dialogos.append(d.message), d.dismiss()))
        pg.on("console", lambda m: m.type == "warning" and consola.append(m.text[:90]))
        entrar(pg, "http://localhost:4200")
        pg.goto(f"http://localhost:4200/catalogo/libros/{libro}"); pg.wait_for_selector("[role=tab]")
        pg.click("[role=tab] >> text=Sinopsis"); pg.wait_for_selector(".sinopsis"); pg.wait_for_timeout(500)
        print("1-2. Sinopsis con ataque →", pg.inner_html(".sinopsis").strip())
        print("     alert ejecutados:", dialogos or "ninguno", "| avisos de Angular:", [c for c in consola if "saniti" in c] or "ninguno")

        print("4. ?next= tras el login:")
        for nxt in ["/prestamos", "https://malicioso.com", "//malicioso.com", "/\t/malicioso.com", "javascript:alert(1)"]:
            pg2 = b.new_page(); entrar(pg2, "http://localhost:4200", nxt)
            print(f"   {nxt!r:26} → {pg2.url.replace('http://localhost:4200', '')}"); pg2.close()

        if "--csp" in sys.argv:
            html = urllib.request.urlopen("http://localhost:8766/").read().decode()
            meta = re.search(r'<meta http-equiv="Content-Security-Policy" content="([^"]+)"', html)
            print("3. CSP en index.html:", re.sub(r"'sha256-[^']+'", "'sha256-…'", meta.group(1)) if meta else "NINGUNA")
            pg3 = b.new_page(); errores = []
            pg3.on("console", lambda m: m.type == "error" and errores.append(m.text[:160]))
            pg3.on("pageerror", lambda e: errores.append(str(e)[:160]))
            entrar(pg3, "http://localhost:8766")
            pg3.goto(f"http://localhost:8766/catalogo/libros/{libro}"); pg3.wait_for_selector("[role=tab]")
            pg3.goto("http://localhost:8766/labs/importacion"); pg3.wait_for_timeout(800)
            if pg3.locator("#en-worker").count():
                pg3.click("#en-worker")
                # (wait_for_function evalúa un string: la propia CSP se lo prohíbe a Playwright)
                pg3.wait_for_selector(".estado:has-text('Hecho')", timeout=60000)
                print("   web worker con la CSP →", pg3.inner_text(".resultado"))
            # lo típico de un XSS: un atributo on…= colado en el HTML (como si alguien hubiera usado bypassSecurityTrustHtml)
            inyectar = """() => { const d = document.createElement('div');
                d.innerHTML = '<img src=x onerror="window.__xss = 1">'; document.body.append(d); }"""
            pg3.evaluate(inyectar); pg3.wait_for_timeout(500)
            sin = b.new_page(); sin.goto("http://localhost:4200/login"); sin.wait_for_selector("input")
            sin.evaluate(inyectar); sin.wait_for_timeout(500)
            print("   onerror inyectado → se ejecuta SIN CSP (ng serve):", sin.evaluate("window.__xss === 1"),
                  "| CON la CSP del build:", pg3.evaluate("window.__xss === 1"))
            print("   app con la CSP: libros en el catálogo y detalle OK | errores de consola:",
                  [e for e in errores if "401" not in e and "WebSocket" not in e and "inline event handler" not in e] or "ninguno")
        b.close()
finally:
    api("PATCH", f"/libros/{libro}/", token, {"sinopsis": original})
