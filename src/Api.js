export async function generateButton(input) {
    const base =
        process.env.REACT_APP_API_BASE ||
        (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8787` : 'http://localhost:8787');

    const body = { component: 'button', ...input };

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10_000);

    let res;
    try {
        res = await fetch(`${base}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: ctrl.signal,
        });
    } finally {
        clearTimeout(t);
    }

    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { /* keep raw text */ }

    if (!res.ok) {
        const msg = data?.error || data?.message || text || `HTTP ${res.status}`;
        const retry = res.headers.get('Retry-After');
        throw new Error(retry ? `${msg} (retry after ${retry}s)` : msg);
    }

    // Expected success shape: { ok: true, html, reasoning, usage }
    return data;
}
