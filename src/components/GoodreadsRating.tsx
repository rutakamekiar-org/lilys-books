"use client";
import styles from "./GoodreadsRating.module.css";
import type { CSSProperties } from "react";

type Props = {
  value: number;           // e.g., 4.55
  ratingCount: number;     // e.g., 51
  reviewCount: number;     // e.g., 39
  url?: string;            // Goodreads page URL
  compact?: boolean;       // optional compact layout
};

// Extend CSSProperties to allow our CSS variable without using `any`.
type StarStyle = CSSProperties & { ["--rating"]?: number };

export default function GoodreadsRating({
  value,
  ratingCount,
  reviewCount,
  url,
  compact,
}: Props) {
  const aria = `Середня оцінка ${value} з 5 на Goodreads, ${ratingCount} оцінок, ${reviewCount} рецензій`;
  const starStyle: StarStyle = { ["--rating"]: value };

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
          <span className={styles.value} aria-hidden="true">{value.toFixed(2)}</span>
          <span className={styles.meta} aria-hidden="true">
            {ratingCount}{'\u00A0'}оцінок · {reviewCount}{'\u00A0'}рецензій
          </span>
        </a>
      ) : (
        <div className={styles.rating} aria-label={aria}>
          <span className={styles.stars} style={starStyle} aria-hidden="true" />
          <span className={styles.value} aria-hidden="true">{value.toFixed(2)}</span>
          <span className={styles.meta} aria-hidden="true">
            {ratingCount}{'\u00A0'}оцінок · {reviewCount}{'\u00A0'}рецензій
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
