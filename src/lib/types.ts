import {ProductItem} from "@/models/Product";

export type BookFormat = "paper" | "digital";
export const getFormat = (p: ProductItem): BookFormat =>
    p.type === 1 ? "paper" : "digital";

export type AgeRating = "0+" | "6+" | "12+" | "16+" | "18+";

export interface CheckoutResponse {
  redirectUrl: string;
}