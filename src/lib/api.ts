import type { CheckoutResponse } from "./types";
import {handleApi} from "@/lib/api.helper";
import {parseProduct, parseProducts, Product} from "@/models/Product";
import {CheckoutFormData} from "@/components/organisms/CheckoutForm";
import {CartItem} from "@/components/providers/CartProvider";
import {PromoCodeResponse} from "@/models/PromoCode";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://api.zvychajna.pp.ua").replace(/\/$/, "");

export async function validatePromocode(code: string, productItemIds: string[]): Promise<PromoCodeResponse> {
    const params = new URLSearchParams();
    params.append("code", code);
    productItemIds.forEach(id => params.append("productItemIds", id));

    const res = await fetch(`${API_URL}/api/PromoCode/validate?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    return handleApi<PromoCodeResponse>(res);
}
export async function createInvoice(data: CheckoutFormData, items: CartItem[], promoCode?: string): Promise<CheckoutResponse> {
    const {orderNote, ...customer} = data;
    const res = await fetch(`${API_URL}/api/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            customer,
            items: items.map(item => ({
                productId: item.itemId,
                quantity: item.quantity,
            })),
            promoCode,
            orderNote,
        }),
    });
    return handleApi<CheckoutResponse>(res);
}
// Product changes reach cached pages through on-demand revalidation (/api/revalidate),
// so the timer is only a safety net. E2E runs pin this higher so cached pages change
// only through explicit revalidation, never on a timer that would capture another test's mock data.
const CATALOG_REVALIDATE_SECONDS = Number(process.env.CATALOG_REVALIDATE_SECONDS) || 3600;
const catalogCache = { next: { revalidate: CATALOG_REVALIDATE_SECONDS } };

async function fetchProducts(options: { throwOnError?: boolean; fresh?: boolean } = {}): Promise<Product[]> {
    try {
        const res = await fetch(
            `${API_URL}/api/products`,
            options.fresh ? { cache: "no-store" } : catalogCache,
        );
        const data = await handleApi<unknown>(res);
        return parseProducts(data);
    } catch (error) {
        console.error("fetchProducts failed:", error);
        if (options.throwOnError) {
            throw error;
        }
        return [];
    }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
    const res = await fetch(`${API_URL}/api/products/${encodeURIComponent(slug)}`, catalogCache);

    if (res.status === 404) {
        return null;
    }

    return parseProduct(await handleApi<unknown>(res));
}

export async function getProductBySlugLive(slug: string): Promise<Product | null> {
    const res = await fetch(`${API_URL}/api/products/${encodeURIComponent(slug)}`, {
        cache: "no-store",
    });

    if (res.status === 404) {
        return null;
    }

    return parseProduct(await handleApi<unknown>(res));
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

export const getProducts = fetchProducts;
export const getProductsLive = () => fetchProducts({ fresh: true, throwOnError: true });

export async function getProductsForStorefront(): Promise<{ products: Product[]; hasError: boolean }> {
    try {
        return { products: await fetchProducts({ throwOnError: true }), hasError: false };
    } catch {
        return { products: [], hasError: true };
    }
}

