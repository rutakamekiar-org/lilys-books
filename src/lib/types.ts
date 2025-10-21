export type BookFormat = "paper" | "digital";

export type AgeRating = "0+" | "6+" | "12+" | "16+" | "18+";

export interface BookFormatInfo {
  type: BookFormat;
  price: number;
  currency: "UAH";
  available: boolean;
  productId: string;
}

export interface BookPhysical {
  seriesName?: string; // назва серії
  publisher?: string; // видавництво
  pages?: number; // кількість сторінок
  coverType?: "мʼяка" | "тверда" | string; // тип палітурки
  publicationYear?: number; // рік видання
  size?: string; // розмір, напр. 145×215 мм
  weight?: string | number; // вага, напр. 350 г
  paperType?: string; // тип паперу
  isbn?: string; // ISBN
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
  physical?: BookPhysical; // optional physical characteristics
}

export interface CheckoutResponse {
  redirectUrl: string;
}