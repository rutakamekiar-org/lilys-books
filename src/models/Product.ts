import {AgeRating} from "@/lib/types";

export interface ProductItem {
    id: string;
    type: number; // 1 = paper, 2 = digital
    isAvailable: boolean;
    price: number;
    currency: string;
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
    type: 'youtube' | 'amazon';
    link: string;
}

export interface Product {
    id: string;
    name: string;
    imageUrl: string;
    items: ProductItem[];
    externalBookRatings: ExternalBookRating[];
    externalLinks: ExternalLink[];
    physicalDetails: PhysicalDetails;
    descriptionHtml?: string;
    excerptHtml?: string;

    slug?: string; // optional backend-provided slug for routing
    author?: string; // author name for display
    ageRating?: AgeRating;
}