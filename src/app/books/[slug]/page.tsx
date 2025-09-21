import type { Metadata } from "next";
import { getBookBySlugMock as getBookBySlug, getBooksMock as getBooks } from "@/lib/api.mock";
import BookDetail from "@/components/BookDetail";
import type { Book } from "@/lib/types";
import { addBasePath } from "@/lib/paths";

 type Props = { params: Promise<{ slug: string }> };

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  const books = await getBooks().catch(() => [] as Book[]);
  return books.map((b: Book) => ({ slug: b.slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const book = await getBookBySlug(slug).catch(() => null);
  if (!book) return { title: "Книга не знайдена" };

  const coverUrl = addBasePath(book.coverUrl);
  return {
    title: `${book.title} — ${book.author}`,
    description: book.descriptionHtml?.toString(),
    openGraph: { title: book.title, description: book.descriptionHtml?.toString(), images: [{ url: coverUrl }] },
    alternates: { canonical: addBasePath(`/books/${book.slug}`) },
  };
}

export default async function BookPage(props: Props) {
  const { slug } = await props.params;
  const book = await getBookBySlug(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: { "@type": "Person", name: book.author },
    image: addBasePath(book.coverUrl),
    description: stripTags(book.descriptionHtml?.toString() ?? ''),
    workExample: book.formats.map((f: Book["formats"][number]) => ({
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