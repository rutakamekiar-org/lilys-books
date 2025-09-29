"use client";
import styles from "./GoodreadsRating.module.css";
import { useEffect, useState, type CSSProperties } from "react";
import { getGoodreadsRating, type GoodreadsRatingData } from "@/lib/api";

// Component now fetches Goodreads data itself
// Props: bookId to fetch; component builds Goodreads URL from externalId; compact to hide the extra button
 type Props = {
  bookId: string;
  compact?: boolean;
};

// Extend CSSProperties to allow our CSS variable without using `any`.
 type StarStyle = CSSProperties & { ["--rating"]?: number };

export default function GoodreadsRating({ bookId, compact }: Props) {
  const [data, setData] = useState<GoodreadsRatingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setData(null);
    if (!bookId) return;

    getGoodreadsRating(bookId)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError("load_failed");
      });

    return () => {
      cancelled = true;
    };
  }, [bookId]);

  // If failed or no data, render nothing as per requirements
  if (!data || error) return null;

  const aria = `Середня оцінка ${data.value} з 5 на Goodreads, ${data.count} оцінок, ${data.reviews} рецензій`;
  const starStyle: StarStyle = { ["--rating"]: data.value };
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
          <span className={styles.value} aria-hidden="true">{data.value.toFixed(2)}</span>
          <span className={styles.meta} aria-hidden="true">
            {data.count}{'\u00A0'}оцінок · {data.reviews}{'\u00A0'}рецензій
          </span>
        </a>
      ) : (
        <div className={styles.rating} aria-label={aria}>
          <span className={styles.stars} style={starStyle} aria-hidden="true" />
          <span className={styles.value} aria-hidden="true">{data.value.toFixed(2)}</span>
          <span className={styles.meta} aria-hidden="true">
            {data.count}{'\u00A0'}оцінок · {data.reviews}{'\u00A0'}рецензій
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
