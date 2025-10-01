export async function safeRedirect(
    url: string,
    onBlocked: (url: string) => void
) {
    function extractHost(u: string) {
        try { return new URL(u).origin; } catch { return null; }
    }

    function probeReachability(origin: string, timeoutMs = 4000): Promise<boolean> {
        return new Promise((resolve) => {
            const img = new Image();
            const t = setTimeout(() => { img.src = ""; resolve(false); }, timeoutMs);
            img.onload = () => { clearTimeout(t); resolve(true); };
            img.onerror = () => { clearTimeout(t); resolve(false); };
            img.src = `${origin}/favicon.ico?cb=${Date.now()}`;
        });
    }

    const origin = extractHost(url);
    if (origin) {
        const ok = await probeReachability(origin);
        if (!ok) { onBlocked(url); return; }
    }
    try { window.location.assign(url); } catch {}
    setTimeout(() => onBlocked(url), 3000);
}
