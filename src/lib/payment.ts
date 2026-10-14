import { z } from "zod";

export const PAYMENT_STORAGE_KEY = "paymentSelections";
export const isPaymentReference = (value: string): boolean =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const selectionSchema = z.object({
    itemId: z.string().uuid(),
    quantity: z.number().int().positive().safe(),
    selectionId: z.string().uuid(),
});

const snapshotSchema = z.object({
    reference: z.string().uuid(),
    items: z.array(selectionSchema).min(1),
});

export type PaymentSelection = z.infer<typeof selectionSchema>;
export type PaymentSelectionSnapshot = z.infer<typeof snapshotSchema>;

export function parsePaymentSelections(value: string | null): PaymentSelectionSnapshot[] {
    if (!value) return [];
    try {
        const result = z.array(snapshotSchema).safeParse(JSON.parse(value));
        return result.success ? result.data : [];
    } catch { return []; }
}

export function selectionKey(items: readonly { itemId: string; quantity: number; selectionId?: string }[]): string {
    return JSON.stringify(items.map(item => [item.itemId, item.quantity, item.selectionId]).sort());
}

export function isSafePaymentUrl(value: string): boolean {
    try {
        const url = new URL(value);
        if (url.username || url.password) return false;
        if (typeof window !== "undefined" && url.origin === window.location.origin && url.pathname === "/payment/success") return true;
        const localTests = /^http:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(process.env.NEXT_PUBLIC_API_URL ?? "");
        return url.protocol === "https:" && (["pay.monobank.ua", "pay.mono.bank", "pay.mbnk.biz"].includes(url.hostname) || (localTests && url.hostname === "example.invalid"));
    } catch { return false; }
}
