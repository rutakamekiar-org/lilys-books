// Payment and free-order returns must use https; plain http is only allowed for local development and tests.
export function isPaymentRedirectUrl(value: string): boolean {
    try {
        const { protocol, hostname } = new URL(value);
        return protocol === "https:" || (protocol === "http:" && (hostname === "localhost" || hostname === "127.0.0.1"));
    } catch { return false; }
}
