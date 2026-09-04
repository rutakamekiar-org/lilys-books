import type { CheckoutResponse } from "./types";
import {notifyApiError, handleApi} from "@/lib/api.helper";
import {Product, StaticMetadata} from "@/models/Product";
import {CheckoutFormData} from "@/components/organisms/CheckoutForm";
import {CartItem} from "@/components/molecules/CartProvider";
import {PromoCodeResponse} from "@/models/PromoCode";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://api.zvychajna.pp.ua").replace(/\/$/, "");

export async function validatePromocode(code: string, productItemIds: string[]): Promise<PromoCodeResponse> {
    const params = new URLSearchParams();
    params.append("code", code);
    productItemIds.forEach(id => params.append("productItemIds", id));

    const res = await fetch(`${API_URL}/api/PromoCode/validate?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    }).catch((err) => {
        notifyApiError(err);
        throw err;
    });
    return handleApi<PromoCodeResponse>(res);
}
export async function createInvoice(data: CheckoutFormData, items: CartItem[], promoCode?: string): Promise<CheckoutResponse> {
    const res = await fetch(`${API_URL}/api/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            customer: data,
            items: items.map(item => ({
                productId: item.itemId,
                quantity: item.quantity,
            })),
            promoCode,
        }),
    }).catch((err) => {
        notifyApiError(err);
        throw err;
    })
    return handleApi<CheckoutResponse>(res);
}
async function fetchProducts(options: { throwOnError?: boolean } = {}): Promise<Product[]> {
    try {
        const res = await fetch(`${API_URL}/api/products`, { next: { revalidate: 60 } });
        const data = await handleApi<Product[]>(res);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("fetchProducts failed:", error);
        if (options.throwOnError) {
            throw error;
        }
        return [];
    }
}

export async function getProductsForStatic(options: { required?: boolean } = {}): Promise<Product[]> {
    // Book route generation must be strict: deploying without product paths would remove
    // crawlable book pages. Non-critical SEO consumers can degrade gracefully and keep
    // the rest of the static site deployable during a temporary API outage.
    const products = await fetchProducts({ throwOnError: options.required });
    if (options.required && products.length === 0) {
        throw new Error("No products returned while generating static SEO pages.");
    }
    return products;
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

