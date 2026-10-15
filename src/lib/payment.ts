import { z } from "zod";

// One localStorage entry per payment attempt so a return in another tab (e.g. after the bank app) can still clean the cart.
const PAYMENT_STORAGE_PREFIX = "paymentSelection:";
const PAYMENT_SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000;

export const isPaymentReference = (value: string): boolean =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const snapshotSchema = z.object({
    createdAt: z.number().int().nonnegative(),
    items: z.array(z.object({
        itemId: z.string().min(1),
        quantity: z.number().int().positive().safe(),
    })).min(1),
});

export type PaymentSnapshot = z.infer<typeof snapshotSchema>;
export type PaymentSelection = PaymentSnapshot["items"][number];

const storageKey = (reference: string) => PAYMENT_STORAGE_PREFIX + reference.toLowerCase();

function removeExpiredSnapshots(now: number) {
    for (let index = localStorage.length - 1; index >= 0; index--) {
        const key = localStorage.key(index);
        if (!key?.startsWith(PAYMENT_STORAGE_PREFIX)) continue;
        const snapshot = parseSnapshot(localStorage.getItem(key));
        if (!snapshot || now - snapshot.createdAt > PAYMENT_SNAPSHOT_TTL_MS) localStorage.removeItem(key);
    }
}

function parseSnapshot(value: string | null): PaymentSnapshot | null {
    if (!value) return null;
    try {
        const result = snapshotSchema.safeParse(JSON.parse(value));
        return result.success ? result.data : null;
    } catch { return null; }
}

export function savePaymentSnapshot(reference: string, items: PaymentSelection[]) {
    if (!isPaymentReference(reference) || !items.length) return;
    try {
        const now = Date.now();
        removeExpiredSnapshots(now);
        localStorage.setItem(storageKey(reference), JSON.stringify({ createdAt: now, items } satisfies PaymentSnapshot));
    } catch { /* Without a snapshot the cart simply stays as it is after payment. */ }
}

// Reads and removes the snapshot so a confirmation can only clean the cart once.
export function takePaymentSnapshot(reference: string): PaymentSnapshot | null {
    try {
        const key = storageKey(reference);
        const snapshot = parseSnapshot(localStorage.getItem(key));
        localStorage.removeItem(key);
        return snapshot && Date.now() - snapshot.createdAt <= PAYMENT_SNAPSHOT_TTL_MS ? snapshot : null;
    } catch { return null; }
}

// Payment and free-order returns must use https; plain http is only allowed for local development and tests.
export function isPaymentRedirectUrl(value: string): boolean {
    try {
        const { protocol, hostname } = new URL(value);
        return protocol === "https:" || (protocol === "http:" && (hostname === "localhost" || hostname === "127.0.0.1"));
    } catch { return false; }
}
