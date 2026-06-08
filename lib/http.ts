// Helpers HTTP com timeout. No Vercel a rede é normal; localmente o Node confia
// no CA do proxy via NODE_EXTRA_CA_CERTS, então o fetch global funciona nos dois.

export async function fetchJson<T = any>(
  url: string,
  opts: { timeout?: number; headers?: Record<string, string> } = {}
): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout ?? 12000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: opts.headers, cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

export async function fetchText(
  url: string,
  opts: { timeout?: number; headers?: Record<string, string> } = {}
): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout ?? 12000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: opts.headers, cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } finally {
    clearTimeout(t);
  }
}
