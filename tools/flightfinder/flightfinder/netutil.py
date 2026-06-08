"""HTTP helpers que respeitam o CA do proxy (TLS interceptado no sandbox web).

O Node confia no CA via NODE_EXTRA_CA_CERTS; replicamos isso no Python apontando
o contexto SSL para o bundle do sistema (que inclui o CA do proxy). Sem isso, as
chamadas HTTPS falham com erro de certificado.
"""
from __future__ import annotations

import json
import os
import ssl
import time
import urllib.error
import urllib.request

# Bundle do sistema (inclui o CA do proxy). Override via SSL_CERT_FILE.
CA_BUNDLE = os.environ.get("SSL_CERT_FILE") or "/etc/ssl/certs/ca-certificates.crt"
UA = "FlightFinder/0.1 (+https://github.com/gxnevx/FlightFinder)"


def _context() -> ssl.SSLContext | None:
    try:
        if os.path.exists(CA_BUNDLE):
            return ssl.create_default_context(cafile=CA_BUNDLE)
    except Exception:
        pass
    return None  # cai no padrão do Python


def fetch(url: str, *, timeout: int = 25, retries: int = 2, headers: dict | None = None) -> bytes:
    """GET cru com retry/backoff. Lança em caso de falha definitiva."""
    ctx = _context()
    h = {"User-Agent": UA, "Accept": "*/*"}
    if headers:
        h.update(headers)
    last: Exception | None = None
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers=h)
            with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            # 429/5xx podem ser transitórios; 4xx restantes não.
            last = e
            if e.code not in (429, 500, 502, 503, 504):
                raise
        except Exception as e:  # rede/TLS/timeout
            last = e
        if attempt < retries:
            time.sleep(1.5 * (attempt + 1))
    assert last is not None
    raise last


def fetch_json(url: str, **kw):
    return json.loads(fetch(url, **kw).decode("utf-8", "replace"))


def fetch_text(url: str, **kw) -> str:
    return fetch(url, **kw).decode("utf-8", "replace")
