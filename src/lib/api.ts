import type { CheckoutResponse } from "./types";
import {notifyApiError, handleApi, memoizeAsync} from "@/lib/api.helper";
import {ExternalLink, Product} from "@/models/Product";
import zvychajna from "@/content/books/zvychajna";
import pid_shepit_snihu from "@/content/books/pid_shepit_snihu";

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
    function getExcerpt(slug: string) {
        switch (slug){
            case "zvychajna": return zvychajna.excerptHtml;
            case "pid_shepit_snihu": return pid_shepit_snihu.excerptHtml;
        }
        return '';
    }
    function getDescription(slug: string) {
        switch (slug){
            case "zvychajna": return zvychajna.descriptionHtml;
            case "pid_shepit_snihu": return pid_shepit_snihu.descriptionHtml;
        }
        return '';
    }
    function getExternalLink(slug: string):ExternalLink[] {
        switch (slug){
            case "zvychajna": return [ { link:'https://www.youtube.com/watch?v=UznBnjro79c', type: "youtube"}];
            case "pid_shepit_snihu": return [ { link:'https://bohdan-books.com/catalog/book/318531', type: "publisher"}];
        }
        return [];
    }

    return products.map(product => {
        return {
            ...product,
            excerptHtml: getExcerpt(product.slug),
            descriptionHtml: getDescription(product.slug),
            externalLinks: getExternalLink(product.slug)
        }
    })
}

export const getProducts = memoizeAsync(fetchProducts, 60 * 1000, () => 'products');

