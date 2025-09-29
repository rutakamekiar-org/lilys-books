import type { CheckoutResponse } from "./types";

const API_URL = "https://spicy-avrit-kukharets-021c9f66.koyeb.app";

interface ApiErrorDetails {
  title?: string;
  errors?: Record<string, string[]>;
  [key: string]: unknown;
}

interface ApiError extends Error {
  details?: ApiErrorDetails;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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

export async function createPaperCheckout(_bookId: string, _quantity: number = 1): Promise<CheckoutResponse> {
  void _bookId; void _quantity; // the current API doesn't use these params
  const res = await fetch(`${API_URL}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
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
  });
  return handleApi<CheckoutResponse>(res);
}

// Goodreads ratings
export interface GoodreadsRatingData {
  value: number;
  count: number;
  reviews: number;
  externalId?: string;
}

interface ExternalRatingDto {
  id: string;
  bookId: string;
  source: string; // "Goodreads"
  externalId: string;
  averageRating: number;
  ratingsCount: number;
  reviewsCount: number;
  snapshotAtUtc: string;
}

// In-memory cache and in-flight de-duplication to avoid double fetches (e.g., React StrictMode)
const GR_TTL_MS = 60 * 60 * 1000; // 1 hour
const grCache = new Map<string, { ts: number; data: GoodreadsRatingData }>();
const grInFlight = new Map<string, Promise<GoodreadsRatingData>>();

export async function getGoodreadsRating(bookId: string): Promise<GoodreadsRatingData> {
  if (!bookId) throw new Error("bookId is required");

  // Serve from cache if fresh
  const cached = grCache.get(bookId);
  const now = Date.now();
  if (cached && now - cached.ts < GR_TTL_MS) {
    return cached.data;
  }

  // Return existing in-flight request if present
  const inflight = grInFlight.get(bookId);
  if (inflight) return inflight;

  const promise = (async () => {
    // Allow browser HTTP cache to store and reuse response up to server policy; our in-memory TTL is 1 hour
    const res = await fetch(`${API_URL}/api/ratings/${bookId}`, { cache: "force-cache" });
    const data = await handleApi<ExternalRatingDto>(res);
    if (data?.source !== "Goodreads" || typeof data.averageRating !== "number") {
      throw new Error("Invalid rating source");
    }
    const normalized: GoodreadsRatingData = {
      value: data.averageRating,
      count: data.ratingsCount ?? 0,
      reviews: data.reviewsCount ?? 0,
      externalId: data.externalId,
    };
    grCache.set(bookId, { ts: Date.now(), data: normalized });
    return normalized;
  })();

  grInFlight.set(bookId, promise);
  try {
    return await promise;
  } finally {
    grInFlight.delete(bookId);
  }
}
