import type { CheckoutResponse } from "./types";
import {notifyApiError, handleApi, memoizeAsync} from "@/lib/api.helper";
import {Product} from "@/models/Product";
import zvychajna from "@/content/books/zvychajna";

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
    const res = await fetch(`${API_URL}/api/products`, { cache: "force-cache" });
    const products = await handleApi<Product[]>(res);
    return products.map(product => {
        return {
            ...product,
            slug: 'zvychajna',
            ageRating: "16+",
            author: 'Лілія Кухарець',
            excerptHtml: zvychajna.excerptHtml,
            descriptionHtml: zvychajna.descriptionHtml,
            externalLinks: [ { link:'https://www.youtube.com/watch?v=UznBnjro79c', type: "youtube"}]
        }
    })
}

export const getProducts = memoizeAsync(fetchProducts, 60 * 60 * 1000, () => 'products');

