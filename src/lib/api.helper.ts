import type { CheckoutResponse } from "./types";
import notify from "@/lib/toast";
import {ApiErrorDetails} from "@/models/ApiErrorDetails";
import {ApiError} from "@/models/ApiError";

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

export async function handleApi<T = CheckoutResponse>(res: Response): Promise<T> {
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

export function memoizeAsync<TResult>(
    fn: () => Promise<TResult>,
    ttlMs: number,
    makeKey?: () => string
): () => Promise<TResult>;

export function memoizeAsync<TParams, TResult>(
    fn: (params: TParams) => Promise<TResult>,
    ttlMs: number,
    makeKey: (params: TParams) => string
): (params: TParams) => Promise<TResult>;

export function memoizeAsync<TParams, TResult>(
    fn: ((params: TParams) => Promise<TResult>) | (() => Promise<TResult>),
    ttlMs: number,
    makeKey?: (params?: TParams) => string
): (params?: TParams) => Promise<TResult> {
    const cache = new Map<string, { ts: number; val: TResult }>();
    const inflight = new Map<string, Promise<TResult>>();
    const keyFn = makeKey ?? (() => "default");

    return async (params?: TParams): Promise<TResult> => {
        const key = keyFn(params);
        const now = Date.now();

        const hit = cache.get(key);
        if (hit && now - hit.ts < ttlMs) return hit.val;
        const inflightHit = inflight.get(key);
        if (inflightHit) return inflightHit;

        const exec: Promise<TResult> =
            fn.length === 0
                ? (fn as () => Promise<TResult>)()
                : (fn as (p: TParams) => Promise<TResult>)(params as TParams);
        
        const p = exec
            .then((val) => {
                cache.set(key, { ts: Date.now(), val });
                return val;
            })
            .finally(() => inflight.delete(key));

        inflight.set(key, p);
        return p;
    };
}