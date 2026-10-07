"use client";

import { useProducts } from "@/components/molecules/ProductsProvider";
import StorefrontErrorState from "./StorefrontErrorState";
import styles from "./StorefrontErrorState.module.css";

export default function ProductsDataState({ headingLevel = 1 }: { headingLevel?: 1 | 2 }) {
  const { isLoading, hasError, refresh } = useProducts();
  const Heading = headingLevel === 1 ? "h1" : "h2";

  if (hasError && !isLoading) {
    return <StorefrontErrorState kind="catalog-error" onRetry={refresh} headingLevel={headingLevel} />;
  }

  return (
    <section className={styles.page} aria-labelledby="products-data-title" aria-busy={isLoading}>
      <div className={styles.card}>
        <Heading id="products-data-title" className={styles.title}>
          {isLoading ? "Завантаження книг" : "Книги незабаром з’являться"}
        </Heading>
        {isLoading ? (
          <>
            <p className={styles.description} role="status">Завантажуємо книги…</p>
            <div className={styles.actions}>
              <button className={styles.primaryAction} type="button" disabled>Завантажуємо…</button>
            </div>
          </>
        ) : (
          <p className={styles.description}>Поки що немає книг для відображення.</p>
        )}
      </div>
    </section>
  );
}
