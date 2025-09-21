import { Book, CheckoutResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;
if (!API_BASE) {
  // Helps during local dev if env is missing
  console.warn("NEXT_PUBLIC_API_BASE is not set. Set it in .env.local");
}

async function apiGet<T>(path: string, revalidateSeconds?: number): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    next: revalidateSeconds ? { revalidate: revalidateSeconds } : undefined,
  });
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const maybeObj = (data && typeof data === "object") ? (data as { title?: string; message?: string }) : null;
    const message = maybeObj?.title || maybeObj?.message || `POST ${path} failed`;
    throw new Error(message);
  }
  return data as T;
}

// Catalog
export const getBooks = () => apiGet<Book[]>("/books", 300);
export const getBookBySlug = (slug: string) => apiGet<Book>(`/books/${slug}`, 120);

// Payments
export const createPaperCheckout = (bookId: string, quantity = 1) =>
  apiPost<CheckoutResponse>("/checkout", { bookId, quantity });

export const createDigitalInvoice = (params: {
  productId: string;
  customerEmail: string;
  customerPhone: string;
}) => apiPost<CheckoutResponse>("/invoice", params);