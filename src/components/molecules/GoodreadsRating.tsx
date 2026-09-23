"use client";
import styles from "./GoodreadsRating.module.css";
import { type CSSProperties } from "react";
import {getExternalBookRatingType, Product} from "@/models/Product";

// Component uses embedded Goodreads rating from a Product only.
type Props = {
  product: Product;
  compact?: boolean;
  variant?: "default" | "card";
};

// Extend CSSProperties to allow our CSS variable without using `any`.
type StarStyle = CSSProperties & { ["--rating"]?: number };

export default function GoodreadsRating({ product, compact, variant = "default" }: Props) {
  const data = product.externalBookRatings.find(x => getExternalBookRatingType(x) === "goodreads");

  // If there is no embedded data, render nothing and never fetch per component.
  if (!data) return null;

  const counts = [
    data.ratingsCount === undefined ? null : `${data.ratingsCount} оцінок`,
    data.reviewsCount === undefined ? null : `${data.reviewsCount} рецензій`,
  ].filter(Boolean).join(", ");
  const aria = `Середня оцінка ${data.averageRating.toFixed(2)} з 5 на Goodreads${counts ? `, ${counts}` : ""}`;
  if (variant === "card") {
    const count = data.reviewsCount ?? data.ratingsCount;
    return (
      <span className={styles.cardRating} aria-label={aria} title="Оцінка Goodreads">
        <span className={`${styles.stars} ${styles.cardStar}`} aria-hidden="true" />
        <span className={styles.cardValue} aria-hidden="true">{data.averageRating.toFixed(2)}</span>
        {count !== undefined && (
          <span className={styles.cardReviews} aria-hidden="true">· {count}</span>
        )}
      </span>
    );
  }

  const starStyle: StarStyle = { ["--rating"]: data.averageRating };
  const url = data.externalId ? `https://www.goodreads.com/book/show/${data.externalId}` : undefined;
  const ratingContent = (
    <>
      <span className={styles.stars} style={starStyle} aria-hidden="true" />
      <span className={styles.value} aria-hidden="true">{data.averageRating.toFixed(2)}</span>
      {counts && <span className={styles.meta} aria-hidden="true">{counts.replace(", ", " · ")}</span>}
    </>
  );

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
          {ratingContent}
        </a>
      ) : (
        <div className={styles.rating} aria-label={aria}>
          {ratingContent}
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
