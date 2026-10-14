export type PaymentOutcome = "authorized" | "success" | "pending" | "failed" | "canceled" | "unverified";

export function getPaymentOutcome(status: string): PaymentOutcome {
    switch (status) {
        case "hold": return "authorized";
        case "success":
        case "delivered": return "success";
        case "created":
        case "init":
        case "processing": return "pending";
        case "failure":
        case "expired": return "failed";
        case "reversed": return "canceled";
        default: return "unverified";
    }
}

export const isPaymentReference = (value: string): boolean =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
import { z } from "zod";


export const PAYMENT_STORAGE_KEY = "paymentAttempts";

const selectionSchema = z.object({
    itemId: z.string().uuid(),
    quantity: z.number().int().positive().safe(),
    format: z.enum(["paper", "digital"]),
    selectionId: z.string().uuid(),
}).refine(item => item.format !== "digital" || item.quantity === 1);

const attemptSchema = z.object({
    reference: z.string().uuid(),
    invoiceId: z.string().min(1),
    paymentUrl: z.string().url().refine(isSafePaymentUrl),
    items: z.array(selectionSchema).min(1),
    promoCode: z.string().optional(),
});

export type PaymentSelection = z.infer<typeof selectionSchema>;
export type PaymentAttempt = z.infer<typeof attemptSchema>;

export function isSafePaymentUrl(value: string): boolean {
    try {
        const url = new URL(value);
        if (url.username || url.password) return false;
        if (typeof window !== "undefined" && url.origin === window.location.origin && url.pathname === "/payment") return true;
        const localTests = /^http:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(process.env.NEXT_PUBLIC_API_URL ?? "");
        return url.protocol === "https:" && (["pay.monobank.ua", "pay.mono.bank"].includes(url.hostname) || (localTests && url.hostname === "example.invalid"));
    } catch { return false; }
}

export function selectionKey(items: readonly { itemId: string; quantity: number; format: string; selectionId?: string }[]): string {
    return JSON.stringify(items.map(item => [item.itemId, item.quantity, item.format, item.selectionId]).sort());
}

export function paymentReceiptUrl(reference: string): string {
    const url = new URL("/payment", window.location.origin);
    url.hash = new URLSearchParams({ reference }).toString();
    return url.href;
}

export function parsePaymentAttempts(value: string | null): PaymentAttempt[] {
    if (!value) return [];
    try {
        const result = z.array(attemptSchema).safeParse(JSON.parse(value));
        return result.success ? result.data : [];
    } catch { return []; }
}

export function matchesPaymentSelection(attempt: PaymentAttempt, items: readonly { itemId: string; quantity: number; format: string }[], promoCode?: string): boolean {
    return (attempt.promoCode ?? "").toUpperCase() === (promoCode ?? "").toUpperCase() &&
        attempt.items.length === items.length && attempt.items.every(purchased => items.some(item =>
            item.itemId === purchased.itemId && item.quantity === purchased.quantity && item.format === purchased.format));
}
