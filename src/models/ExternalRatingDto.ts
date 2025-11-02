export interface ExternalRatingDto {
    id: string;
    bookId: string;
    source: string; // "Goodreads"
    externalId: string;
    averageRating: number;
    ratingsCount: number;
    reviewsCount: number;
    snapshotAtUtc: string;
}