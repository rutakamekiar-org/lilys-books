import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import { getProducts } from "@/lib/api";
import GoodreadsRating from "@/components/GoodreadsRating";
import {addBasePath, withCacheBust} from "@/lib/paths";
import type { Product } from "@/models/Product";
import {getMinPrice} from "@/lib/product-item.helper";

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
  const products: Product[] = await getProducts().catch(() => []);
  const product = products[0] || null;
  const featured = product
  if (!featured) return null;
  const minPrice = getMinPrice(featured.items)
    return (
    <section className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.copy}>
          <h1>«{featured.name}»</h1>
            {featured.genre && <p>{featured.genre}</p>}

          {featured && (
            <>
              {/* Goodreads rating for featured */}
              <GoodreadsRating
                product={product as Product}
              />

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
              </div>
            </>
          )}
        </div>

        <div className={styles.cover}>
          {featured && (
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
              <Image src={addBasePath(featured.imageUrl)} alt={featured.name} width={360} height={540} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
