import type { Product } from "@/models/Product";
import { getPrice } from "@/lib/product-item.helper";
import { SITE_NAME, stripHtml } from "@/lib/site";
import { absoluteUrl } from "@/lib/site.server";

const MAX_TITLE_LENGTH = 70;

export function getProductDescription(product: Product): string {
  return stripHtml(product.seoDescription)
    || stripHtml(product.description)
    || `${product.name} — ${product.type === 2 ? "мерч" : product.type === 3 ? "комплект книг" : "книга"}${product.author?.trim() ? ` ${product.author.trim()}` : ""}.`;
}

export function getProductTitle(product: Product): string {
  // Include the layout's site suffix in the budget; long contributor lists stay in the book details.
  const budget = MAX_TITLE_LENGTH - ` | ${SITE_NAME}`.length;
  const name = product.name.trim();
  const author = product.author?.trim();
  const withAuthor = author ? `${name} — ${author}` : name;
  if (withAuthor.length <= budget) return withAuthor;
  if (name.length <= budget) return name;

  const prefix = name.slice(0, budget - 1);
  const wordBoundary = prefix.lastIndexOf(" ");
  return `${(wordBoundary > 0 ? prefix.slice(0, wordBoundary) : prefix).trimEnd()}…`;
}

export function buildProductJsonLd(product: Product): Record<string, unknown> {
  const canonicalUrl = absoluteUrl(`/books/${product.slug}`);
  const isBook = product.type === undefined || product.type === 1;
  const offers = product.items
    .filter(item => Number.isFinite(getPrice(item)) && getPrice(item) >= 0 && /^[A-Z]{3}$/.test(item.currency))
    .map(item => ({
      "@type": "Offer",
      "@id": `${canonicalUrl}#offer-${item.id}`,
      sku: item.id,
      name: item.name,
      url: canonicalUrl,
      price: String(getPrice(item)),
      priceCurrency: item.currency,
      availability: item.isAvailable ? "https://schema.org/InStock"
        : item.canPreorder ? "https://schema.org/PreOrder" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    }));

  return {
    "@context": "https://schema.org",
    "@type": isBook ? ["Product", "Book"] : "Product",
    "@id": `${canonicalUrl}#product`,
    sku: product.id,
    name: product.name,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    image: [...new Set([product.imageUrl, ...product.imageUrls].map(absoluteUrl))],
    description: getProductDescription(product),
    ...(offers.length > 0 ? { offers } : {}),
    ...(isBook ? {
      inLanguage: "uk-UA",
      bookFormat: [...new Set(product.items
        .filter(item => item.type === 1 || item.type === 2)
        .map(item => item.type === 1 ? "https://schema.org/PrintBook" : "https://schema.org/EBook"))],
      ...(product.author?.trim() ? { author: { "@type": "Person", name: product.author.trim() } } : {}),
      ...(product.physicalDetails?.publisher?.trim() ? {
        publisher: { "@type": "Organization", name: product.physicalDetails.publisher.trim() },
      } : {}),
      ...(product.physicalDetails?.isbn?.trim() ? { isbn: product.physicalDetails.isbn.trim() } : {}),
      ...(product.physicalDetails?.publicationYear ? { datePublished: String(product.physicalDetails.publicationYear) } : {}),
    } : {}),
  };
}

export function serializeProductJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
