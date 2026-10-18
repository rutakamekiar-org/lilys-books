import type { Metadata } from "next";
import { getProductBySlug, getProductsForStatic } from "@/lib/api";
import BookDetail from "@/components/organisms/BookDetail";
import type { Product } from "@/models/Product";
import { buildMetaDescription, SITE_NAME } from "@/lib/site";
import { buildProductJsonLd, getProductDescription, getProductTitle, serializeProductJsonLd } from "@/lib/product-seo";
import { absoluteUrl } from "@/lib/site.server";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

// Must be a literal; keep in step with CATALOG_REVALIDATE_SECONDS in src/lib/api.ts.
export const revalidate = 3600;

// Prerender known books so visitors get a CDN-cached page instead of a per-request render.
// Slugs missing here (new books, or an API outage at build time) still render on demand and are then cached.
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const products = await getProductsForStatic();
  return products.map(({ slug }) => ({ slug }));
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function getFullProduct(slug: string): Promise<Product | null> {
  return getProductBySlug(slug);
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const fullProduct = await getFullProduct(slug);
  if (!fullProduct) notFound();
  const description = buildMetaDescription(getProductDescription(fullProduct));
  const title = getProductTitle(fullProduct);
  const image = absoluteUrl(fullProduct.imageUrl);
  const canonicalPath = `/books/${fullProduct.slug}`;
  const isBook = fullProduct.type === undefined || fullProduct.type === 1;
  const openGraphBookFields = {
    ...(hasText(fullProduct.author) ? { authors: [fullProduct.author] } : {}),
    ...(hasText(fullProduct.physicalDetails?.isbn) ? { isbn: fullProduct.physicalDetails.isbn } : {}),
  };

  return {
    title,
    description,
    openGraph: { 
      type: isBook ? "book" : "website",
      locale: "uk_UA",
      siteName: SITE_NAME,
      title,
      description,
      url: canonicalPath,
      images: [{ url: image, alt: fullProduct.name }],
      ...(isBook ? openGraphBookFields : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: { canonical: canonicalPath },
  };
}

export default async function BookPage(props: Props) {
  const { slug } = await props.params;
  const fullProduct = await getFullProduct(slug);
  if (!fullProduct) notFound();
  const jsonLd = buildProductJsonLd(fullProduct);

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: serializeProductJsonLd(jsonLd) }} />
      <BookDetail key={fullProduct.slug} product={fullProduct} />
    </>
  );
}
