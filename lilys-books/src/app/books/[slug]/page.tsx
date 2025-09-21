import type { Metadata } from "next";
import { getBookBySlugMock as getBookBySlug, getBooksMock as getBooks } from "@/lib/api.mock";
import BookDetail from "@/components/BookDetail";

 type Props = { params: { slug: string } };

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  const books = await getBooks().catch(() => [] as any[]);
  return books.map((b: any) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const book = await getBookBySlug(params.slug).catch(() => null);
  if (!book) return { title: "Книга не знайдена" };

  return {
    title: `${book.title} — ${book.author}`,
    description: book.descriptionHtml?.toString(),
    openGraph: { title: book.title, description: book.descriptionHtml?.toString(), images: [{ url: book.coverUrl }] },
    alternates: { canonical: `/books/${book.slug}` },
  };
}

export default async function BookPage({ params }: Props) {
  const book = await getBookBySlug(params.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: { "@type": "Person", name: book.author },
    image: book.coverUrl,
    description: stripTags(book.descriptionHtml?.toString() ?? ''),
    workExample: book.formats.map((f: any) => ({
      "@type": "Book",
      bookFormat: f.type === "paper" ? "https://schema.org/PrintBook" : "https://schema.org/EBook",
      offers: {
        "@type": "Offer",
        price: String(f.price),
        priceCurrency: f.currency,
        availability: f.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BookDetail book={book} />
    </>
  );
}