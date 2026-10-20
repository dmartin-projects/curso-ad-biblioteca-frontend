"""Qué paquetes van en el bundle INICIAL (lo que se descarga al arrancar). Uso:
    ng build --stats-json && python3 scripts/analizar-bundle.py
"""
import collections
import json
import sys

stats = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "dist/frontend/browser-stats.json"))
salidas = stats["outputs"]
main = next(k for k in salidas if k.split("/")[-1].startswith("main-") and k.endswith(".js"))

# los chunks iniciales: main y todo lo que importa de forma ESTÁTICA (no los import() diferidos)
iniciales, pendientes = set(), [main]
while pendientes:
    chunk = pendientes.pop()
    if chunk not in iniciales:
        iniciales.add(chunk)
        pendientes += [i["path"] for i in salidas[chunk].get("imports", []) if i["kind"] == "import-statement"]

por_paquete = collections.Counter()
for chunk in iniciales:
    for entrada, info in salidas[chunk]["inputs"].items():
        if "node_modules/" in entrada:
            partes = entrada.split("node_modules/")[-1].split("/")
            paquete = "/".join(partes[:2]) if partes[0].startswith("@") else partes[0]
        else:
            paquete = "(tu código)"
        por_paquete[paquete] += info["bytesInOutput"]

print(f"Módulos en los chunks iniciales: {sum(por_paquete.values()) / 1024:.0f} kB (la cifra exacta, la del ng build)")
for paquete, tam in por_paquete.most_common(12):
    print(f"{tam / 1024:8.1f} kB  {paquete}")
