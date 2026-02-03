"use client";
import { useEffect, useState } from "react";
import styles from "./GoodreadsButton.module.css";
import {ExternalBookRating, getExternalBookRatingType, Product} from "@/models/Product";

// A lightweight component that only renders the Goodreads button
// Appears under the cover image in BookDetail. Uses only embedded data from Product.
export default function GoodreadsButton({ product }: { product: Product }) {
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
