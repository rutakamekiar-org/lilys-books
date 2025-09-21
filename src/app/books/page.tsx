import type { Metadata } from "next";
import { getBooksMock as getBooks } from "@/lib/api.mock";
import BookCard from "@/components/BookCard";
import styles from "./books.module.css";

export const metadata: Metadata = {
  title: "Книги — каталог",
  description: "Перегляньте всі доступні книги та оберіть паперовий або електронний формат.",
};

export const dynamic = "force-static";

export default async function BooksPage() {
  const books = await getBooks().catch(() => []);
  return (
    <section>
      <h1>Книги</h1>
      {(!books || books.length === 0) ? (
        <p className={styles.empty}>Поки що немає книг для відображення.</p>
      ) : (
        <div className={styles.grid}>
          {books.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}
    </section>
  );
}