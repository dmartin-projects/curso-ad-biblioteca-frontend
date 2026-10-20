"""Módulo 61: el gráfico de /admin no deja instancias de Chart.js vivas al entrar y salir.
Necesita ng serve en :4200 (en desarrollo existe `ng.getComponent`) y Django en :8000.

⚠️ Las idas y venidas se hacen DENTRO de la página (un solo evaluate). Si se hacen con
pg.click()/wait_for_selector(), Playwright guarda referencias a los elementos que encuentra
("DevTools console" en el heap snapshot) y parece que la app pierde nodos aunque no sea así.
"""
import time
from playwright.sync_api import sync_playwright

B = "http://localhost:4200"
CICLOS = """async ([n, esperarGrafico]) => {
  const hasta = (cond) => new Promise(ok => { const t = setInterval(() => { if (cond()) { clearInterval(t); ok(); } }, 30); });
  const ir = (r) => { history.pushState({}, '', r); dispatchEvent(new PopStateEvent('popstate', { state: {} })); };
  for (let i = 0; i < n; i++) {
    ir('/admin'); await hasta(() => document.querySelector('mat-sidenav-content h1')?.textContent.includes('Administración'));
    // bajar hasta el gráfico (el scroll está en <mat-sidenav-content>): dispara el @defer (on viewport)
    await hasta(() => { document.querySelector('mat-sidenav-content').scrollTop = 1e6; return !!document.querySelector('app-grafico canvas'); });
    // la mitad de las veces se sale enseguida, mientras Chart.js aún se está cargando/creando
    if (esperarGrafico || i % 2 === 0) await new Promise(r => setTimeout(r, 600));
    ir('/catalogo'); await hasta(() => document.querySelector('app-libro-card'));
  }
}"""

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1280, "height": 800})
    cdp = pg.context.new_cdp_session(pg); cdp.send("Performance.enable")

    def vivos(var):
        cdp.send("HeapProfiler.collectGarbage")
        proto = cdp.send("Runtime.evaluate", {"expression": f"window.{var}"})["result"]["objectId"]
        arr = cdp.send("Runtime.queryObjects", {"prototypeObjectId": proto})["objects"]["objectId"]
        n = cdp.send("Runtime.callFunctionOn", {"objectId": arr, "functionDeclaration": "function(){return this.length}", "returnByValue": True})["result"]["value"]
        cdp.send("Runtime.releaseObject", {"objectId": arr}); cdp.send("Runtime.releaseObject", {"objectId": proto})
        return n

    def metricas():
        cdp.send("HeapProfiler.collectGarbage"); cdp.send("HeapProfiler.collectGarbage")
        m = {x["name"]: x["value"] for x in cdp.send("Performance.getMetrics")["metrics"]}
        return int(m["JSEventListeners"]), int(m["Nodes"])

    for _ in range(3):  # el login admite 5 intentos por minuto (módulo 36)
        pg.goto(f"{B}/login"); pg.locator("input[type=email]").wait_for()
        pg.fill("input[type=email]", "biblio@example.com"); pg.fill("input[type=password]", "clave-segura-123")
        pg.click("button[type=submit]"); pg.wait_for_timeout(3000)
        if "/catalogo" in pg.url: break
        time.sleep(61)

    pg.evaluate(CICLOS, [1, True]); pg.evaluate(CICLOS, [0, True])
    # una vez, para sacar los prototipos de Chart y de Grafico (y poder contar instancias vivas)
    pg.evaluate("""async () => {
      history.pushState({}, '', '/admin'); dispatchEvent(new PopStateEvent('popstate', { state: {} }));
      while (!document.querySelector('app-grafico canvas')) { document.querySelector('mat-sidenav-content').scrollTop = 1e6; await new Promise(r => setTimeout(r, 50)); }
      await new Promise(r => setTimeout(r, 600));
      const g = ng.getComponent(document.querySelector('app-grafico'));
      window.__pGraf = Object.getPrototypeOf(g); window.__pChart = Object.getPrototypeOf(g.grafico);
      window.__etiqueta = document.querySelector('app-grafico canvas').getAttribute('aria-label');
      window.__tabla = document.querySelector('app-grafico-generos details').textContent.replace(/\\s+/g, ' ');
      history.pushState({}, '', '/catalogo'); dispatchEvent(new PopStateEvent('popstate', { state: {} }));
      while (!document.querySelector('app-libro-card')) await new Promise(r => setTimeout(r, 50));
    }""")
    print("Gráfico:", pg.evaluate("window.__etiqueta"), "|", pg.evaluate("window.__tabla")[:100])
    antes = metricas()
    print("Antes: objetos Chart vivos =", vivos("__pChart"), "| componentes Grafico vivos =", vivos("__pGraf"))
    pg.evaluate(CICLOS, [10, False])
    despues = metricas()
    print(f"Tras 10 entradas y salidas: objetos Chart vivos = {vivos('__pChart')}, componentes Grafico vivos = {vivos('__pGraf')}")
    print(f"listeners {antes[0]} → {despues[0]} | nodos DOM {antes[1]} → {despues[1]}")
    b.close()
