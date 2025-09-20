export type BookFormat = "paper" | "digital";

export interface BookFormatInfo {
  type: BookFormat;
  price: number;
  currency: "UAH";
  available: boolean;
  productId?: string; // needed for digital
}

export interface Book {
  id: string;
  slug: string;
  title: string;
  author: string;
  description: string;
  coverUrl: string; // absolute or /images/...
  rating?: { value: number; count: number; reviews: number };
  formats: BookFormatInfo[];
  links?: { goodreads?: string; amazon?: string };
  excerptHtml?: string;
  descriptionHtml?: string; // optional rich HTML description from static content
}

export interface CheckoutResponse {
  redirectUrl: string;
}