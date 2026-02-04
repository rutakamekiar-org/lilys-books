import type { CheckoutResponse } from "./types";
import {notifyApiError, handleApi, memoizeAsync} from "@/lib/api.helper";
import {Product, StaticMetadata} from "@/models/Product";
import {CheckoutFormData} from "@/components/organisms/CheckoutForm";
import {CartItem} from "@/components/molecules/CartProvider";

const API_URL = "https://api.zvychajna.pp.ua";

export async function createPaperCheckout(productItemId: string, _quantity: number = 1): Promise<CheckoutResponse> {
  const qty = Math.max(1, Math.floor(Number(_quantity) || 1));
  const res = await fetch(`${API_URL}/api/checkout?id=${productItemId}&count=${encodeURIComponent(qty)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }).catch((err) => {
      notifyApiError(err);
      throw err;
  })
  return handleApi<CheckoutResponse>(res);
}

export async function createInvoice(data: CheckoutFormData, items: CartItem[]): Promise<CheckoutResponse> {
    const res = await fetch(`${API_URL}/api/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            customer: data,
            items: items.map(item => ({
                productId: item.itemId,
                quantity: item.quantity,
            })),
        }),
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

async function fetchProducts(): Promise<Product[]> {
    try {
        const res = await fetch(`${API_URL}/api/products`, { next: { revalidate: 60 } });
        const data = await handleApi<Product[]>(res);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("fetchProducts failed:", error);
        return [];
    }
}

export async function getLocalMetadata(slug: string): Promise<StaticMetadata> {
    try {
        // Use relative path for better compatibility with dynamic imports in some environments
        const meta = await import(`../content/books/${slug}`);
        return meta.default;
    } catch (e) {
        console.warn(`No local metadata found for slug: ${slug}`, e);
        return {};
    }
}

export const getProducts = fetchProducts;

