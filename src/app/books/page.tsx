import type { Metadata } from "next";
import BooksGrid from "./BooksGrid";

export const metadata: Metadata = {
  title: "Книги — каталог",
  description: "Перегляньте всі доступні книги та оберіть паперовий або електронний формат.",
};

export default async function BooksPage() {
  return (
    <section>
      <h1>Книги та мерч</h1>
      <BooksGrid />
    </section>
  );
}