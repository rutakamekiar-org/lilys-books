import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import { getBooksMock } from "@/lib/api.mock";

export const metadata: Metadata = {
  title: "Лілія Кухарець — офіційний сайт",
  description: "Книги Лілії Кухарець: анонси, описи та придбання паперових і електронних версій.",
};

export default async function HomePage() {
  const books = await getBooksMock().catch(() => []);
  const featured = books[0] || null;

  return (
    <section className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.copy}>
          <h1>Вітаю! Я — Лілія Кухарець</h1>
          <p>Авторка романів. Тут ви можете дізнатися більше та придбати мої книги.</p>

          {featured ? (
            <>
              <p className={styles.featuredLine}>
                Рекомендовано: <strong>{featured.title}</strong>
              </p>
              <div className={styles.actions}>
                <Link href={`/books/${featured.slug}`} className={styles.cta}>Купити зараз</Link>
                <Link href="/books" className={styles.secondary}>Перейти до каталогу</Link>
              </div>
            </>
          ) : (
            <div className={styles.actions}>
              <Link href="/books" className={styles.cta}>Перейти до каталогу</Link>
              <Link href="/about" className={styles.secondary}>Про мене</Link>
            </div>
          )}
        </div>

        <div className={styles.cover}>
          {featured ? (
            <Image src={featured.coverUrl} alt={featured.title} width={360} height={540} />
          ) : (
            <Image src="/images/book.jpg" alt="Обкладинка книги" width={360} height={540} />
          )}
        </div>
      </div>
    </section>
  );
}
