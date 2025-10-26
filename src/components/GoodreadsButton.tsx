"use client";
import { useEffect, useState } from "react";
import styles from "./GoodreadsButton.module.css";
import { getGoodreadsRating, type GoodreadsRatingData } from "@/lib/api";

// A lightweight component that only renders the Goodreads button
// Appears under the cover image in BookDetail. It fetches the same data
// as GoodreadsRating but only shows the button when a Goodreads URL is available.
export default function GoodreadsButton({ bookId }: { bookId: string }) {
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

  if (error || !data?.externalId) return null;

  const url = `https://www.goodreads.com/book/show/${data.externalId}`;

  return (
    <a
      className={`${styles.btn} ${styles.btnGoodreads}`}
      href={url}
      target="_blank"
      rel="noopener"
      aria-label="Перейти на сторінку книги на Goodreads"
      style={{ marginTop: 12, display: "flex", width: "100%", justifyContent: "center" }}
    >
      <i className="fa-brands fa-goodreads" aria-hidden="true"></i>
      <span>Відгуки на Goodreads</span>
    </a>
  );
}
