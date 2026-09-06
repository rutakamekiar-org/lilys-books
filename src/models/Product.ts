import { z } from "zod";

const requiredText = z.string().trim().min(1);
const optionalText = z.string().nullable().optional().transform(value => value ?? undefined);
const optionalNumber = z.number().finite().nullable().optional().transform(value => value ?? undefined);

const ProductItemSchema = z.object({
    id: z.string().uuid(),
    name: requiredText,
    type: z.number().int(),
    format: z.number().int().optional(),
    isAvailable: z.boolean(),
    canPreorder: z.boolean(),
    price: z.number().finite().nonnegative(),
    discountPrice: optionalNumber,
    currency: requiredText,
    note: optionalText,
});

const PhysicalDetailsSchema = z.object({
    seriesName: optionalText,
    publisher: optionalText,
    pages: z.number().int().nonnegative().nullable().optional().transform(value => value ?? undefined),
    coverType: optionalText,
    publicationYear: z.number().int().nullable().optional().transform(value => value ?? undefined),
    size: optionalText,
    weight: optionalNumber,
    paperType: optionalText,
    isbn: optionalText,
});

const ExternalBookRatingSchema = z.object({
    source: z.number().int(),
    externalId: requiredText,
    averageRating: z.number().finite(),
    ratingsCount: z.number().int().nonnegative().nullable().optional().transform(value => value ?? undefined),
    reviewsCount: z.number().int().nonnegative().nullable().optional().transform(value => value ?? undefined),
});

const ExternalLinkSchema = z.object({
    label: requiredText,
    icon: optionalText,
    url: requiredText,
});

export const ProductSchema = z.object({
    id: z.string().uuid(),
    name: requiredText,
    slug: requiredText,
    type: z.number().int().optional(),
    genre: optionalText,
    imageUrl: requiredText,
    imageUrls: z.array(requiredText).nullable().optional(),
    items: z.array(ProductItemSchema),
    externalBookRatings: z.array(ExternalBookRatingSchema).default([]),
    externalLinks: z.array(ExternalLinkSchema).default([]),
    physicalDetails: PhysicalDetailsSchema.nullable().optional().transform(value => value ?? undefined),
    seoDescription: optionalText,
    description: optionalText,
    hasExcerpt: z.boolean().optional().default(false),
    author: optionalText,
    ageRating: optionalText,
    isHero: z.boolean().optional(),
    isActive: z.boolean().optional(),
}).transform(product => ({
    ...product,
    imageUrls: product.imageUrls?.length ? product.imageUrls : [product.imageUrl],
}));

export const ProductListSchema = z.array(ProductSchema);

export type Product = z.infer<typeof ProductSchema>;
export type ProductItem = z.infer<typeof ProductItemSchema>;
export type PhysicalDetails = z.infer<typeof PhysicalDetailsSchema>;
export type ExternalBookRating = z.infer<typeof ExternalBookRatingSchema>;
export type ExternalLink = z.infer<typeof ExternalLinkSchema>;

export type ExternalBookRatingType = "goodreads";
export const getExternalBookRatingType = (p: ExternalBookRating): ExternalBookRatingType =>
    p.source === 1 ? "goodreads" : "goodreads";

export function parseProduct(value: unknown): Product {
    const result = ProductSchema.safeParse(value);
    if (!result.success) {
        console.error("Invalid product API response:", result.error.issues);
        throw new Error("The product API returned invalid data.");
    }
    return result.data;
}

export function parseProducts(value: unknown): Product[] {
    const result = ProductListSchema.safeParse(value);
    if (!result.success) {
        console.error("Invalid products API response:", result.error.issues);
        throw new Error("The products API returned invalid data.");
    }
    return result.data;
}
