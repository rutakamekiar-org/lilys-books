import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import { getBooksMock } from "@/lib/api.mock";
import GoodreadsRating from "@/components/GoodreadsRating";
import {addBasePath, withCacheBust} from "@/lib/paths";

export const metadata: Metadata = {
  title: "Лілія Кухарець — офіційний сайт",
  description: "Книги Лілії Кухарець: анонси, описи та придбання паперових і електронних версій.",
};

function formatUAH(amount: number) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function HomePage() {
  const books = await getBooksMock().catch(() => []);
  const featured = books[0] || null;

  // Compute minimal price among available formats, fallback to any format
    const available = featured.formats.filter(f => f.available);
    const minPrice = available.length ? Math.min(...available.map(f => f.price)) : null;


    return (
    <section className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.copy}>
          <h1>Вітаю! Я — Лілія Кухарець</h1>
          <p>Авторка романів. Тут ви можете дізнатися більше та придбати мої книги.</p>

          {featured ? (
            <>
              {/* Goodreads rating for featured */}
              {featured.rating && (
                <GoodreadsRating
                  value={featured.rating.value}
                  ratingCount={featured.rating.count}
                  reviewCount={featured.rating.reviews}
                  url={featured.links?.goodreads}
                />
              )}

              {featured.descriptionHtml && (
                <div
                  className={styles.featuredDescription}
                  dangerouslySetInnerHTML={{ __html: featured.descriptionHtml}}
                />
              )}

              {minPrice !== null && (
                <p className={styles.featuredLine}>Від {formatUAH(minPrice)}</p>
              )}

              <div className={styles.actions}>
                <Link href={withCacheBust(`/books/${featured.slug}`)} className={styles.cta}>Детальніше</Link>
                <Link href={withCacheBust("/books")} className={styles.secondary}>Перейти до каталогу</Link>
              </div>
            </>
          ) : (
            <div className={styles.actions}>
              <Link href={withCacheBust("/books")} className={styles.cta}>Перейти до каталогу</Link>
              <Link href={withCacheBust("/about")} className={styles.secondary}>Про мене</Link>
            </div>
          )}
        </div>

        <div className={styles.cover}>
          {featured ? (
            <>
              {featured.ageRating && (
                <span
                  className={`${styles.ageBadge} ${styles["age" + featured.ageRating.replace("+", "p")]}`}
                  aria-label={`Вікове обмеження: ${featured.ageRating}`}
                  title={`Вікове обмеження: ${featured.ageRating}`}
                >
                  {featured.ageRating}
                </span>
              )}
              <Image src={addBasePath(featured.coverUrl)} alt={featured.title} width={360} height={540} />
            </>
          ) : (
            <Image src={addBasePath("/images/book.jpg")} alt="Обкладинка книги" width={360} height={540} />
          )}
        </div>
      </div>
    </section>
  );
}
