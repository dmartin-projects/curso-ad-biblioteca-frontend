"""Mide fugas en /fugas con Chrome DevTools Protocol. Requiere `ng serve --port 4248` y `pip install playwright`."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    logs = []
    pg.on("console", lambda m: logs.append(m.text))
    cdp = pg.context.new_cdp_session(pg)
    cdp.send("Performance.enable")

    def metricas():
        cdp.send("HeapProfiler.collectGarbage")
        m = {x["name"]: x["value"] for x in cdp.send("Performance.getMetrics")["metrics"]}
        return int(m["JSEventListeners"]), int(m["Nodes"])

    def vivos(var):
        cdp.send("HeapProfiler.collectGarbage")
        proto = cdp.send("Runtime.evaluate", {"expression": f"window.{var}"})["result"]["objectId"]
        arr = cdp.send("Runtime.queryObjects", {"prototypeObjectId": proto})["objects"]["objectId"]
        return cdp.send("Runtime.callFunctionOn", {"objectId": arr, "functionDeclaration": "function(){return this.length}", "returnByValue": True})["result"]["value"]

    pg.goto("http://localhost:4248/fugas")
    pg.wait_for_selector("#alternar-fuga")

    for boton, sel, var in [("#alternar-fuga", "app-lista-gastos-fuga", "__pFuga"),
                            ("#alternar-tud", "app-lista-gastos-tud", "__pTud"),
                            ("#alternar-grafico", "app-grafico-gastos", "__pGraf")]:
        pg.click(boton); pg.wait_for_selector(sel)
        pg.evaluate(f"window.{var} = Object.getPrototypeOf(ng.getComponent(document.querySelector('{sel}')))")
        if var == "__pGraf":
            pg.wait_for_timeout(100)
            pg.evaluate("window.__pChart = Object.getPrototypeOf(ng.getComponent(document.querySelector('app-grafico-gastos')).grafico)")
        pg.click(boton); pg.wait_for_selector(sel, state="detached")

    for boton, var, nombre in [("#alternar-fuga", "__pFuga", "ListaGastosFuga"), ("#alternar-tud", "__pTud", "ListaGastosTud")]:
        for _ in range(10):
            pg.click(boton); pg.wait_for_timeout(30); pg.click(boton); pg.wait_for_timeout(30)
        logs.clear()
        pg.click("#guardar"); pg.wait_for_timeout(200)
        print(f"{nombre}: instancias vivas tras 11 entradas/salidas = {vivos(var)}; logs al guardar = {sum(nombre in l for l in logs)}")

    for boton, nombre in [("#alternar-grafico", "con destroy()"), ("#alternar-grafico-sin", "SIN destroy()")]:
        antes = metricas()
        for _ in range(10):
            pg.click(boton); pg.wait_for_timeout(80); pg.click(boton); pg.wait_for_timeout(30)
        pg.wait_for_timeout(300)
        despues = metricas()
        print(f"  objetos Chart vivos: {vivos('__pChart')}")
        print(f"Gráfico {nombre}: listeners {antes[0]} → {despues[0]}, nodos DOM {antes[1]} → {despues[1]}")
    print("Instancias de GraficoGastos vivas:", vivos("__pGraf"))
    b.close()
