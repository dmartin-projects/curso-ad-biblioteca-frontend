"""Sirve un build de Angular como lo hará nginx: archivos estáticos, fallback a index.html
y (opcional) /api y /media reenviados a Django. Uso:
    python3 scripts/servidor_spa.py dist/frontend/browser 8766 [http://localhost:8000]
"""
import gzip
import http.server
import os
import sys
import urllib.error
import urllib.request

raiz, puerto = sys.argv[1], int(sys.argv[2])
backend = sys.argv[3] if len(sys.argv) > 3 else None
SALTAR = {"connection", "keep-alive", "transfer-encoding", "content-encoding", "content-length"}


class Manejador(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=raiz, **k)

    def log_message(self, *a):
        pass

    def _proxy(self):
        cuerpo = self.rfile.read(int(self.headers.get("Content-Length") or 0)) or None
        peticion = urllib.request.Request(backend + self.path, data=cuerpo, method=self.command)
        for k, v in self.headers.items():
            if k.lower() not in ("host", "connection"):
                peticion.add_header(k, v)
        peticion.add_header("Host", self.headers["Host"])
        try:
            respuesta = urllib.request.urlopen(peticion)
        except urllib.error.HTTPError as e:
            respuesta = e
        datos = respuesta.read()
        self.send_response(respuesta.status)
        for k, v in respuesta.headers.items():
            if k.lower() not in SALTAR:
                self.send_header(k, v)
        self.send_header("Content-Length", str(len(datos)))
        self.end_headers()
        self.wfile.write(datos)

    def _es_api(self):
        return backend and self.path.startswith(("/api/", "/media/"))

    def do_GET(self):
        if self._es_api():
            return self._proxy()
        ruta = os.path.join(raiz, self.path.split("?")[0].lstrip("/"))
        if not os.path.isfile(ruta):
            self.path, ruta = "/index.html", os.path.join(raiz, "index.html")  # rutas de Angular
        if "gzip" in self.headers.get("Accept-Encoding", "") and ruta.endswith((".js", ".css", ".html")):
            datos = gzip.compress(open(ruta, "rb").read())  # como el gzip de nginx (módulo 65)
            self.send_response(200)
            self.send_header("Content-Type", self.guess_type(ruta))
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Content-Length", str(len(datos)))
            self.end_headers()
            self.wfile.write(datos)
            return None
        return super().do_GET()

    def end_headers(self):
        if not self._es_api():
            # como nginx (módulo 65): archivos con hash → caché larga; index.html → siempre validar
            nombre = self.path.split("?")[0]
            self.send_header("Cache-Control", "no-cache" if nombre.endswith((".html", "/")) else "public, max-age=31536000, immutable")
        super().end_headers()

    do_POST = do_PUT = do_PATCH = do_DELETE = _proxy


http.server.ThreadingHTTPServer(("", puerto), Manejador).serve_forever()
