import type { Metadata } from "next";
import BooksGrid from "./BooksGrid";
import { absoluteUrl } from "@/lib/site.server";

const BOOKS_TITLE = "Книги Лілії Кухарець";
const BOOKS_DESCRIPTION = "Каталог книг Лілії Кухарець: паперові й електронні видання.";
const BOOKS_SOCIAL_IMAGE = absoluteUrl("/images/photo_2025-09-21_20-57-11.jpg");

export const metadata: Metadata = {
  title: "Книги — каталог",
  description: "Перегляньте всі доступні книги та оберіть паперовий або електронний формат.",
  alternates: { canonical: "/books" },
  openGraph: {
    type: "website",
    locale: "uk_UA",
    title: BOOKS_TITLE,
    description: BOOKS_DESCRIPTION,
    url: "/books",
    images: [{ url: BOOKS_SOCIAL_IMAGE, alt: BOOKS_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: BOOKS_TITLE,
    description: BOOKS_DESCRIPTION,
    images: [BOOKS_SOCIAL_IMAGE],
  },
};

export default async function BooksPage() {
  return (
    <section>
      <h1>Книги та мерч</h1>
      <BooksGrid />
    </section>
  );
}
