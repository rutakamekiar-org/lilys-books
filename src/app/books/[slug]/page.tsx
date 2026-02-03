import type { Metadata } from "next";
import { getProducts, getLocalMetadata } from "@/lib/api";
import BookDetail from "@/components/organisms/BookDetail";
import type { Product } from "@/models/Product";
import { addBasePath } from "@/lib/paths";
import {getPrice} from "@/lib/product-item.helper";

 type Props = { params: Promise<{ slug: string }> };

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  const products: Product[] = await getProducts().catch(() => [] as Product[]);
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const products: Product[] = await getProducts().catch(() => [] as Product[]);
  const product = products.find(x => x.slug === slug);
  if (!product) return { title: "Книга не знайдена" };

  const meta = await getLocalMetadata(slug);

  return {
    title: `${product.name} — ${product.author}`,
    description: meta.descriptionHtml ? stripTags(meta.descriptionHtml) : product.name,
    openGraph: { 
      title: product.name, 
      description: meta.descriptionHtml ? stripTags(meta.descriptionHtml) : product.name, 
      images: [{ url: product.imageUrl }] 
    },
    alternates: { canonical: addBasePath(`/books/${product.slug}`) },
  };
}

export default async function BookPage(props: Props) {
  const { slug } = await props.params;
  const products: Product[] = await getProducts().catch(() => [] as Product[]);
  const product = products.find(x => x.slug === slug);
  if (!product) throw new Error("Not found");

  const meta = await getLocalMetadata(slug);
  const fullProduct = { ...product, ...meta };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: fullProduct.name,
    author: { "@type": "Person", name: fullProduct.author },
    image: addBasePath(fullProduct.imageUrl),
    description: stripTags(fullProduct.descriptionHtml?.toString() ?? ''),
    workExample: fullProduct.items.map((f) => ({
      "@type": "Book",
      bookFormat: f.type === 1 ? "https://schema.org/PrintBook" : "https://schema.org/EBook",
      offers: {
        "@type": "Offer",
        price: String(getPrice(f)),
        priceCurrency: f.currency,
        availability: f.isAvailable || f.canPreorder ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BookDetail product={fullProduct} />
    </>
  );
}