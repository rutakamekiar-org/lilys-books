import type { CheckoutResponse } from "./types";
import notify from "@/lib/toast";
import {GoodreadsRatingData} from "@/models/GoodreadsRatingData";
import {ExternalRatingDto} from "@/models/ExternalRatingDto";

const API_URL = "https://api.zvychajna.pp.ua";

export interface ApiErrorDetails {
  title?: string;
  errors?: Record<string, string[]>;
  [key: string]: unknown;
}

export interface ApiError extends Error {
  details?: ApiErrorDetails;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function notifyApiError(err: unknown) {
  type ErrorDetails = { errors?: Record<string, string[]> };
  const message = err instanceof Error ? err.message : undefined;
  const details: ErrorDetails | undefined =
    typeof err === "object" && err !== null && "details" in err
      ? (err as { details?: ErrorDetails }).details
      : undefined;
  const errs = details?.errors;
  if (errs) {
    if (errs.CustomerEmail?.[0]) {
      notify.error("Будь ласка, введіть дійсну адресу електронної пошти.");
      return;
    }
    if (errs.CustomerPhone?.[0]) {
      notify.error("Будь ласка, введіть дійсний номер телефону.");
      return;
    }
    const firstKey = Object.keys(errs)[0];
    notify.error((firstKey ? errs[firstKey]?.[0] : undefined) || message || "Виникла помилка.");
  } else {
    if (err instanceof TypeError && typeof navigator !== "undefined" && !navigator.onLine) {
      notify.error("Відсутнє інтернет-з’єднання.");
    } else if (err instanceof TypeError) {
      notify.error("Не вдалося встановити безпечне з’єднання із сервером. Спробуйте змінити мережу або скористайтеся VPN.");
    } else {
      notify.error("Сталася помилка. Спробуйте пізніше.");
    }
  }
}

async function handleApi<T = CheckoutResponse>(res: Response): Promise<T> {
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore JSON parse errors
  }
  if (!res.ok) {
    const title = (isRecord(data) && typeof data.title === "string")
      ? data.title
      : `Request failed with ${res.status}`;
    const err: ApiError = new Error(title);
    err.details = isRecord(data) ? (data as ApiErrorDetails) : undefined;
    throw err;
  }
  return data as T;
}

function memoizeAsync<T>(
    fn: (key: string) => Promise<T>,
    ttlMs: number
): (key: string) => Promise<T> {
    const cache = new Map<string, { ts: number; val: T }>();
    const inflight = new Map<string, Promise<T>>();
    return async (key: string) => {
        const now = Date.now();
        const hit = cache.get(key);
        if (hit && now - hit.ts < ttlMs) return hit.val;
        if (inflight.has(key)) return inflight.get(key)!;
        const p = fn(key)
            .then((v) => {
                cache.set(key, { ts: Date.now(), val: v });
                return v;
            })
            .finally(() => inflight.delete(key));
        inflight.set(key, p);
        return p;
    };
}


export async function createPaperCheckout(bookId: string, _quantity: number = 1): Promise<CheckoutResponse> {
  const qty = Math.max(1, Math.floor(Number(_quantity) || 1));
  const res = await fetch(`${API_URL}/api/checkout?id=${bookId}&count=${encodeURIComponent(qty)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }).catch((err) => {
      notifyApiError(err);
      throw err;
  })
  return handleApi<CheckoutResponse>(res);
}

export async function createDigitalInvoice(params: {
  productId: string;
  customerEmail: string;
  customerPhone: string;
}): Promise<CheckoutResponse> {
  const res = await fetch(`${API_URL}/api/invoice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: params.productId,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
    }),
  }).catch((err) => {
      notifyApiError(err);
      throw err;
  })
  return handleApi<CheckoutResponse>(res);
}

async function fetchGoodreadsRating(bookId: string): Promise<GoodreadsRatingData> {
    if (!bookId) throw new Error("bookId required");
    bookId = '528c4b8b-ea9b-4231-9d37-def2c6b10be1'
    const res = await fetch(`${API_URL}/api/ratings/${bookId}`, { cache: "force-cache" });
    const dto = await handleApi<ExternalRatingDto>(res);
    if (dto.source !== "Goodreads") throw new Error("Invalid source");
    return {
        value: dto.averageRating,
        count: dto.ratingsCount ?? 0,
        reviews: dto.reviewsCount ?? 0,
        externalId: dto.externalId,
    };
}
export const getGoodreadsRating = memoizeAsync(fetchGoodreadsRating, 60 * 60 * 1000);
