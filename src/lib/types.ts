export type BookFormat = "paper" | "digital";

export type AgeRating = "0+" | "6+" | "12+" | "16+" | "18+";

export interface BookFormatInfo {
  type: BookFormat;
  price: number;
  currency: "UAH";
  available: boolean;
  productId: string;
}

export interface Book {
  id: string;
  slug: string;
  title: string;
  author: string;
  coverUrl: string; // absolute or /images/...
  formats: BookFormatInfo[];
  links?: { goodreads?: string; amazon?: string };
  excerptHtml?: TrustedHTML;
  descriptionHtml?: TrustedHTML; // optional rich HTML description from static content
  ageRating?: AgeRating; // optional age rating label like "16+"
}

export interface CheckoutResponse {
  redirectUrl: string;
}