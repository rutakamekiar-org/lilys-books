// zod/mini keeps this client-shipped schema tree-shakeable; the classic "zod" entry bundles every locale.
import * as z from "zod/mini";
import { storefrontImageSource } from "@/lib/product-gallery";

const requiredText = z.string().check(z.trim(), z.minLength(1));
const orUndefined = <T,>(value: T | null | undefined) => value ?? undefined;
const optionalOf = <T extends z.core.SomeType>(schema: T) =>
    z.pipe(z.optional(z.nullable(schema)), z.transform(orUndefined<z.output<T>>));
const optionalText = optionalOf(z.string());
const optionalNumber = optionalOf(z.number());
const optionalCount = optionalOf(z.int().check(z.nonnegative()));

const ProductItemSchema = z.object({
    id: z.uuid(),
    name: requiredText,
    type: z.int(),
    format: z.optional(z.int()),
    isAvailable: z.boolean(),
    canPreorder: z.boolean(),
    price: z.number().check(z.nonnegative()),
    discountPrice: optionalNumber,
    currency: requiredText,
    note: optionalText,
});

const PhysicalDetailsSchema = z.object({
    seriesName: optionalText,
    publisher: optionalText,
    pages: optionalCount,
    coverType: optionalText,
    publicationYear: optionalOf(z.int()),
    size: optionalText,
    weight: optionalNumber,
    paperType: optionalText,
    isbn: optionalText,
});

const ExternalBookRatingSchema = z.object({
    source: z.int(),
    externalId: requiredText,
    averageRating: z.number(),
    ratingsCount: optionalCount,
    reviewsCount: optionalCount,
});

const ExternalLinkSchema = z.object({
    label: requiredText,
    icon: optionalText,
    url: requiredText,
});

export const ProductSchema = z.pipe(z.object({
    id: z.uuid(),
    name: requiredText,
    slug: requiredText,
    type: z.optional(z.int()),
    genre: optionalText,
    imageUrl: requiredText,
    imageUrls: z.optional(z.nullable(z.array(requiredText))),
    items: z.array(ProductItemSchema),
    externalBookRatings: z._default(z.array(ExternalBookRatingSchema), []),
    externalLinks: z._default(z.array(ExternalLinkSchema), []),
    physicalDetails: optionalOf(PhysicalDetailsSchema),
    seoDescription: optionalText,
    description: optionalText,
    hasExcerpt: z._default(z.optional(z.boolean()), false),
    author: optionalText,
    ageRating: optionalText,
    isHero: z.optional(z.boolean()),
    isActive: z.optional(z.boolean()),
}), z.transform(product => {
    // The API mixes absolute storefront URLs and root-relative paths for the same file;
    // one form per image gives every consumer one optimizer URL and one download.
    const imageUrl = storefrontImageSource(product.imageUrl);
    return {
        ...product,
        imageUrl,
        imageUrls: product.imageUrls?.length ? product.imageUrls.map(storefrontImageSource) : [imageUrl],
    };
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
        const details = result.error.issues
            .map(issue => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
            .join("; ");
        throw new Error(`The products API returned invalid data: ${details}`);
    }
    return result.data;
}
