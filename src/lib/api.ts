import type { CheckoutResponse } from "./types";
import {GoodreadsRatingData} from "@/models/GoodreadsRatingData";
import {ExternalRatingDto} from "@/models/ExternalRatingDto";
import {notifyApiError, handleApi, memoizeAsync} from "@/lib/api.helper";
import {Product} from "@/models/Product";

const API_URL = "https://api.zvychajna.pp.ua";

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
export const getGoodreadsRating = memoizeAsync<string, GoodreadsRatingData>(fetchGoodreadsRating, 60 * 60 * 1000, (id) => id);

async function fetchProducts(): Promise<Product[]> {
    const res = await fetch(`${API_URL}/api/products`, { cache: "force-cache" });
    const products = await handleApi<Product[]>(res);
    return products
}

export const getProducts = memoizeAsync(fetchProducts, 60 * 60 * 1000, () => 'products');

