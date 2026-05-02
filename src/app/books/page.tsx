import type { Metadata } from "next";
import BooksGrid from "./BooksGrid";

export const metadata: Metadata = {
  title: "Книги — каталог",
  description: "Перегляньте всі доступні книги та оберіть паперовий або електронний формат.",
  alternates: { canonical: "/books" },
  openGraph: {
    title: "Книги Лілії Кухарець",
    description: "Каталог книг Лілії Кухарець: паперові й електронні видання.",
    url: "/books",
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
