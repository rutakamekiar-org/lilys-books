"use client";
import Image from "next/image";
import Link from "next/link";
import type { Book } from "@/lib/types";
import styles from "./BookCard.module.css";
import {addBasePath, withCacheBust} from "@/lib/paths";

export default function BookCard({ book }: { book: Book }) {
  const available = book.formats.filter(f => f.available);
  const minPrice = available.length ? Math.min(...available.map(f => f.price)) : null;

  return (
    <Link href={withCacheBust(`/books/${book.slug}`)} className={styles.card}>
      <div className={styles.thumb}>
        {book.ageRating && (
          <span
            className={`${styles.ageBadge} ${styles["age" + book.ageRating.replace("+", "p")]}`}
            aria-label={`Вікове обмеження: ${book.ageRating}`}
            title={`Вікове обмеження: ${book.ageRating}`}
          >
            {book.ageRating}
          </span>
        )}
        <Image src={addBasePath(book.coverUrl)} alt={book.title} width={240} height={360} />
      </div>
      <div className={styles.meta}>
        <h3>{book.title}</h3>
        <p className={styles.price}>{minPrice !== null ? `від ${minPrice} грн` : "Немає в наявності"}</p>
      </div>
    </Link>
  );
}