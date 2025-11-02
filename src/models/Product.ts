export interface ProductItem {
    id: string;
    type: number;
    isAvailable: boolean;
    price: number;
    currency: string;
}

export interface Product {
    id: string;
    name: string;
    imageUrl: string;
    items: ProductItem[];
}