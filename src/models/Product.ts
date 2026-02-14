import {AgeRating} from "@/lib/types";

export interface ProductItem {
    id: string;
    name: string;
    type: number; // 1 = paper, 2 = digital
    isAvailable: boolean;
    canPreorder: boolean;
    price: number;
    discountPrice?: number;
    currency: string;
    note?: string;
}

export interface PhysicalDetails {
    seriesName: string;
    publisher: string;
    pages: number;
    coverType: string;
    publicationYear: number;
    size: string;
    weight: number;
    paperType: string;
    isbn: string;
}

export type ExternalBookRatingType = "goodreads";
export const getExternalBookRatingType = (p: ExternalBookRating): ExternalBookRatingType =>
    p.source === 1 ? "goodreads" : "goodreads";


export interface ExternalBookRating {
    source: number;
    externalId: string; // e.g. Goodreads book ID
    averageRating: number;
    ratingsCount?: number;
    reviewsCount?: number;
}

export interface ExternalLink {
    type: 'youtube' | 'amazon' | 'publisher' | 'riga';
    link: string;
}

export interface StaticMetadata {
    descriptionHtml?: string;
    excerptHtml?: string;
    imageUrls?: string[];
    externalLinks?: ExternalLink[];
    hasExcerpt?: boolean;
}

export interface Product {
    id: string;
    name: string;
    genre?: string;
    imageUrl: string;
    imageUrls?: string[];
    items: ProductItem[];
    externalBookRatings: ExternalBookRating[];
    externalLinks: ExternalLink[];
    physicalDetails: PhysicalDetails;
    descriptionHtml?: string;
    excerptHtml?: string;
    hasExcerpt?: boolean;

    slug: string;
    author?: string; // author name for display
    ageRating?: AgeRating;
    isHero?: boolean;
}