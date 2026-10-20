"""Sirve un build de Angular con fallback a index.html (como hará nginx). Uso: servidor_spa.py RAIZ PUERTO"""
import http.server, os, sys
raiz, puerto = sys.argv[1], int(sys.argv[2])
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=raiz, **k)
    def log_message(s, *a): pass
    def send_head(s):
        if not os.path.exists(os.path.join(raiz, s.path.split('?')[0].lstrip('/'))): s.path = '/index.html'
        return super().send_head()
http.server.ThreadingHTTPServer(('', puerto), H).serve_forever()
