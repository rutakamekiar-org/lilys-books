"use client";
import styles from "./GoodreadsRating.module.css";
import { useEffect, useState, type CSSProperties } from "react";
import {ExternalBookRating, getExternalBookRatingType, Product} from "@/models/Product";

// Component uses embedded Goodreads rating from a Product only.
 type Props = {
  product: Product;
  compact?: boolean;
};

// Extend CSSProperties to allow our CSS variable without using `any`.
 type StarStyle = CSSProperties & { ["--rating"]?: number };

export default function GoodreadsRating({ product, compact }: Props) {
  const [data, setData] = useState<ExternalBookRating | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setData(null);
    if (!product) return;

    const rating = product.externalBookRatings.find(x => getExternalBookRatingType(x) === "goodreads");
    if (rating) {
      setData(rating);
    } else {
      setError("no_embedded_rating");
    }
  }, [product]);

  // If failed or no data, render nothing as per requirements
  if (!data || error) return null;

  const aria = `Середня оцінка ${data.averageRating} з 5 на Goodreads, ${data.ratingsCount} оцінок, ${data.reviewsCount} рецензій`;
  const starStyle: StarStyle = { ["--rating"]: data.averageRating };
  const url = data.externalId ? `https://www.goodreads.com/book/show/${data.externalId}` : undefined;

  return (
    <div className={styles.row}>
      {url ? (
        <a
          className={styles.rating}
          href={url}
          target="_blank"
          rel="noopener"
          aria-label={aria + '. Натисніть, щоб відкрити сторінку на Goodreads у новій вкладці.'}
          title="Відкрити на Goodreads"
        >
          <span className={styles.stars} style={starStyle} aria-hidden="true" />
          <span className={styles.value} aria-hidden="true">{data.averageRating.toFixed(2)}</span>
          <span className={styles.meta} aria-hidden="true">
            {data.ratingsCount}{'\u00A0'}оцінок · {data.reviewsCount}{'\u00A0'}рецензій
          </span>
        </a>
      ) : (
        <div className={styles.rating} aria-label={aria}>
          <span className={styles.stars} style={starStyle} aria-hidden="true" />
          <span className={styles.value} aria-hidden="true">{data.averageRating.toFixed(2)}</span>
          <span className={styles.meta} aria-hidden="true">
            {data.ratingsCount}{'\u00A0'}оцінок · {data.reviewsCount}{'\u00A0'}рецензій
          </span>
        </div>
      )}
      {url && !compact && (
        <a
          className={`${styles.btn} ${styles.btnGoodreads}`}
          href={url}
          target="_blank"
          rel="noopener"
          aria-label="Перейти на сторінку книги на Goodreads"
        >
          <i className="fa-brands fa-goodreads" aria-hidden="true"></i>
          <span>Відгуки на Goodreads</span>
        </a>
      )}
    </div>
  );
}
