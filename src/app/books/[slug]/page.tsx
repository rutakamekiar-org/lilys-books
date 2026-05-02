import type { Metadata } from "next";
import { getProductsForStatic, getLocalMetadata } from "@/lib/api";
import BookDetail from "@/components/organisms/BookDetail";
import type { Product } from "@/models/Product";
import {getPrice} from "@/lib/product-item.helper";
import { buildMetaDescription, SITE_AUTHOR, SITE_NAME, stripHtml } from "@/lib/site";
import { absoluteUrl } from "@/lib/site.server";
import { notFound } from "next/navigation";

 type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  const products: Product[] = await getProductsForStatic({ required: true });
  return products.map((p) => ({ slug: p.slug }));
}

function getProductDescription(product: Product): string {
  return stripHtml(product.seoDescription ?? product.descriptionHtml) || `${product.name} — книга ${product.author ?? SITE_AUTHOR}.`;
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const products: Product[] = await getProductsForStatic();
  const product = products.find(x => x.slug === slug);
  if (!product) notFound();

  const meta = await getLocalMetadata(slug);
  const fullProduct = { ...product, ...meta };
  const description = buildMetaDescription(getProductDescription(fullProduct));
  const image = absoluteUrl(fullProduct.imageUrl);
  const canonicalPath = `/books/${fullProduct.slug}`;
  const openGraphBookFields = {
    ...(hasText(fullProduct.author) ? { authors: [fullProduct.author] } : {}),
    ...(hasText(fullProduct.physicalDetails?.isbn) ? { isbn: fullProduct.physicalDetails.isbn } : {}),
  };

  return {
    title: `${fullProduct.name} — ${fullProduct.author ?? SITE_AUTHOR}`,
    description,
    openGraph: { 
      type: "book",
      locale: "uk_UA",
      siteName: SITE_NAME,
      title: `${fullProduct.name} — ${fullProduct.author ?? SITE_AUTHOR}`,
      description,
      url: canonicalPath,
      images: [{ url: image, alt: fullProduct.name }],
      ...openGraphBookFields,
    },
    twitter: {
      card: "summary_large_image",
      title: `${fullProduct.name} — ${fullProduct.author ?? SITE_AUTHOR}`,
      description,
      images: [image],
    },
    alternates: { canonical: canonicalPath },
  };
}

export default async function BookPage(props: Props) {
  const { slug } = await props.params;
  const products: Product[] = await getProductsForStatic();
  const product = products.find(x => x.slug === slug);
  if (!product) notFound();

  const meta = await getLocalMetadata(slug);
  const fullProduct = { ...product, ...meta };
  const canonicalUrl = absoluteUrl(`/books/${fullProduct.slug}`);
  const description = getProductDescription(fullProduct);
  const workExample = fullProduct.items
    .filter((item) => hasNumber(getPrice(item)) && hasText(item.currency))
    .map((item) => ({
      "@type": "Book",
      bookFormat: item.type === 1 ? "https://schema.org/PrintBook" : "https://schema.org/EBook",
      offers: {
        "@type": "Offer",
        url: canonicalUrl,
        price: String(getPrice(item)),
        priceCurrency: item.currency,
        availability: item.isAvailable || item.canPreorder ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      },
    }));

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": `${canonicalUrl}#book`,
    name: fullProduct.name,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    inLanguage: "uk-UA",
    author: { "@type": "Person", name: fullProduct.author ?? SITE_AUTHOR },
    publisher: { "@type": "Person", name: SITE_AUTHOR },
    image: absoluteUrl(fullProduct.imageUrl),
    description,
  };

  if (hasText(fullProduct.physicalDetails?.isbn)) {
    jsonLd.isbn = fullProduct.physicalDetails.isbn;
  }

  if (hasNumber(fullProduct.physicalDetails?.publicationYear)) {
    jsonLd.datePublished = fullProduct.physicalDetails.publicationYear.toString();
  }

  if (workExample.length > 0) {
    jsonLd.workExample = workExample;
  }

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BookDetail product={fullProduct} />
    </>
  );
}
