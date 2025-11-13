import {ProductItem} from "@/models/Product";

export function getMinPrice(items: ProductItem[]): number {
    return Math.min(...items.map(x => getPrice(x)).filter(x => x !== null) as number[] || []);
}

export function getPrice(item: ProductItem): number {
    return Math.min(...[item.price, item.discountPrice].filter(x => x !== null) as number[] || []);
}