import type { Metadata } from "next";
import { getProducts } from "@/lib/api";
import BookDetail from "@/components/BookDetail";
import type { Product } from "@/models/Product";
import { addBasePath } from "@/lib/paths";

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

  return {
    title: `${product.name} — ${product.author}`,
    description: product.descriptionHtml?.toString(),
    openGraph: { title: product.name, description: product.descriptionHtml?.toString(), images: [{ url: product.imageUrl }] },
    alternates: { canonical: addBasePath(`/books/${product.slug}`) },
  };
}

export default async function BookPage(props: Props) {
  const { slug } = await props.params;
  const products: Product[] = await getProducts().catch(() => [] as Product[]);
  const product = products.find(x => x.slug === slug);
  if (!product) throw new Error("Not found");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: product.name,
    author: { "@type": "Person", name: product.author },
    image: addBasePath(product.imageUrl),
    description: stripTags(product.descriptionHtml?.toString() ?? ''),
    workExample: product.items.map((f) => ({
      "@type": "Book",
      bookFormat: f.type === 1 ? "https://schema.org/PrintBook" : "https://schema.org/EBook",
      offers: {
        "@type": "Offer",
        price: String(f.price),
        priceCurrency: f.currency,
        availability: f.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BookDetail product={product} />
    </>
  );
}