import type { Metadata } from "next";
import { getBookBySlugMock as getBookBySlug } from "@/lib/api.mock";
import BookDetail from "@/components/BookDetail";

type Props = { params: { slug: string } };

// Helper to load static content for a book by slug from src/content/books/<slug>.ts
async function loadBookContent(
  slug: string
): Promise<{ description?: string; descriptionHtml?: string; excerptHtml?: string }> {
  try {
    const mod = await import(`@/content/books/${slug}`);
    return (mod && (mod as any).default) || {};
  } catch {
    return {};
  }
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const book = await getBookBySlug(params.slug).catch(() => null);
  if (!book) return { title: "Книга не знайдена" };
  const content = await loadBookContent(book.slug);
  const descriptionPlain =
    (content.descriptionHtml ? stripTags(content.descriptionHtml) : undefined) ||
    book.description;

  return {
    title: `${book.title} — ${book.author}`,
    description: descriptionPlain,
    openGraph: { title: book.title, description: descriptionPlain, images: [{ url: book.coverUrl }] },
    alternates: { canonical: `/books/${book.slug}` },
  };
}

export const revalidate = 120;

export default async function BookPage({ params }: Props) {
  const book = await getBookBySlug(params.slug);
  const content = await loadBookContent(book.slug);
  const bookWithContent = {
    ...book,
    ...(content.descriptionHtml ? { descriptionHtml: content.descriptionHtml } : {}),
    ...(content.excerptHtml ? { excerptHtml: content.excerptHtml } : {}),
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: bookWithContent.title,
    author: { "@type": "Person", name: bookWithContent.author },
    image: bookWithContent.coverUrl,
    description:
      (bookWithContent as any).description ||
      ((bookWithContent as any).descriptionHtml ? stripTags((bookWithContent as any).descriptionHtml) : ""),
    workExample: bookWithContent.formats.map((f: any) => ({
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
      <BookDetail book={bookWithContent} />
    </>
  );
}