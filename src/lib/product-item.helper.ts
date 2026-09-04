import type {Product, ProductItem} from "@/models/Product";

export function getMinPrice(items: ProductItem[]): number | null {
    if (items.length === 0) return null;
    return Math.min(...items.map(getPrice));
}

export function getPrice(item: ProductItem): number {
    return item.discountPrice ?? item.price;
}

export function getProductItemDisplayLabel(product: Product, item: ProductItem): string {
    if (product.type === 3) return "Комплект";
    if (product.type === 2) return getShortItemName(item.name) || "Мерч";
    if (item.type === 1) return "Паперова";
    if (item.type === 2) return "Електронна";
    return getShortItemName(item.name) || "Формат";
}

function getShortItemName(name?: string | null): string | null {
    const trimmed = name?.trim();
    if (!trimmed) return null;

    const beforeQuote = trimmed.split(/[«"']/)[0]?.trim();
    const cleaned = (beforeQuote || trimmed).replace(/[–—:-]\s*$/, "").trim();
    return cleaned || trimmed;
}
