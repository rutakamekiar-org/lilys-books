import type { Metadata } from "next";
import { getProducts } from "@/lib/api";
import BookCard from "@/components/BookCard";
import styles from "./books.module.css";
import type { Product } from "@/models/Product";

export const metadata: Metadata = {
  title: "Книги — каталог",
  description: "Перегляньте всі доступні книги та оберіть паперовий або електронний формат.",
};

export const dynamic = "force-static";

export default async function BooksPage() {
  const products: Product[] = await getProducts().catch(() => []);
  return (
    <section>
      <h1>Книги</h1>
      {(!products || products.length === 0) ? (
        <p className={styles.empty}>Поки що немає книг для відображення.</p>
      ) : (
        <div className={styles.grid}>
          {products.map((b) => (
            <BookCard key={b.id} product={b} />
          ))}
        </div>
      )}
    </section>
  );
}