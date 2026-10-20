#!/usr/bin/env bash
# Lighthouse (rendimiento) de una página que necesita sesión: el refresh va en una cookie,
# así que basta con pasarla como cabecera extra; la app restaura la sesión sola al arrancar.
# Uso: scripts/lighthouse.sh http://localhost:8766/catalogo biblio@example.com clave-segura-123
set -euo pipefail
URL=$1; ORIGEN=$(echo "$URL" | cut -d/ -f1-3)
COOKIE=$(curl -s -i -X POST "$ORIGEN/api/v1/auth/login/" -H "Content-Type: application/json" \
  -d "{\"email\":\"$2\",\"password\":\"$3\"}" | grep -i '^set-cookie' | sed 's/^[Ss]et-[Cc]ookie: //' | cut -d';' -f1)
npx --yes lighthouse@12 "$URL" --quiet --chrome-flags="--headless=new --no-sandbox" \
  --only-categories=performance --extra-headers="{\"Cookie\":\"$COOKIE\"}" \
  --output=json --output=html --output-path=./lighthouse
python3 - <<'PY'
import json
d = json.load(open("lighthouse.report.json")); a = d["audits"]
print("Rendimiento:", round(d["categories"]["performance"]["score"] * 100))
for k in ["first-contentful-paint", "largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "speed-index"]:
    print(f"  {a[k]['title']}: {a[k]['displayValue']}")
print("  Peso total:", a["total-byte-weight"]["displayValue"])
PY
