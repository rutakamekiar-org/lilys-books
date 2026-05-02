import type {Product, ProductItem} from "@/models/Product";

export function getMinPrice(items: ProductItem[]): number {
    return Math.min(...items.map(x => getPrice(x)).filter(x => x !== null) as number[] || []);
}

export function getPrice(item: ProductItem): number {
    return Math.min(...[item.price, item.discountPrice].filter(x => x !== null) as number[] || []);
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
