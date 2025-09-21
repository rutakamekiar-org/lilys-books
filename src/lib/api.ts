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
