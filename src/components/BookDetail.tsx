"use client";
import Image from "next/image";
import { useState } from "react";
import type { Book, BookFormat } from "@/lib/types";
import Drawer from "./PurchaseDrawer/Drawer";
import styles from "./BookDetail.module.css";
import GoodreadsRating from "./GoodreadsRating";
import grStyles from "./GoodreadsRating.module.css";
import { addBasePath } from "@/lib/paths";

export default function BookDetail({ book }: { book: Book }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<BookFormat>("paper");
  const selected = book.formats.find(f => f.type === format);

  return (
    <section className={styles.wrap}>
      <div className={styles.grid}>
        <div className={styles.cover}>
          <Image src={addBasePath(book.coverUrl)} alt={book.title} width={320} height={480} />
          {book.links?.goodreads && (
            <a
              className={`${grStyles.btn} ${grStyles.btnGoodreads}`}
              href={book.links.goodreads}
              target="_blank"
              rel="noopener"
              aria-label="Перейти на сторінку книги на Goodreads"
              style={{ marginTop: 12, display: "flex", width: "100%", justifyContent: "center" }}
            >
              <i className="fa-brands fa-goodreads" aria-hidden="true"></i>
              <span>Відгуки на Goodreads</span>
            </a>
          )}
        </div>
        <div className={styles.content}>
          <h1 className={styles.titleRow}>
            {book.title}
            {book.ageRating && (
              <span
                className={`${styles.ageBadge} ${styles["age" + book.ageRating.replace("+", "p")]}`}
                aria-label={`Вікове обмеження: ${book.ageRating}`}
                title={`Вікове обмеження: ${book.ageRating}`}
              >
                {book.ageRating}
              </span>
            )}
          </h1>

          {book.rating && (
            <GoodreadsRating
              value={book.rating.value}
              ratingCount={book.rating.count}
              reviewCount={book.rating.reviews}
              url={book.links?.goodreads}
              compact
            />
          )}

          {book.descriptionHtml && (
            <div className={styles.desc} dangerouslySetInnerHTML={{ __html: book.descriptionHtml}} />
          )}

          <div role="radiogroup" aria-label="Формат" className={styles.segmented}>
            {book.formats.map(f => (
              <label key={f.type} className={`${styles.opt} ${format === f.type ? styles.active : ""} ${!f.available ? styles.disabled : ""}`}>
                <input
                  type="radio"
                  name="format"
                  value={f.type}
                  checked={format === f.type}
                  disabled={!f.available}
                  onChange={() => setFormat(f.type)}
                />
                <span>{f.type === "paper" ? "Паперова" : "Електронна"} • {f.price} грн</span>
              </label>
            ))}
          </div>

          <div className={styles.buybar}>
            <button className={styles.buy} disabled={!selected?.available} onClick={() => setOpen(true)}>
              {selected?.available ? `Купити — ${selected.price} грн` : "Немає в наявності"}
            </button>
            <small className={styles.hint}>Натисніть, щоб оформити замовлення</small>
            {book.ageRating && (
              <small className={styles.hint}>Вікове обмеження: {book.ageRating}</small>
            )}
          </div>

          {book.excerptHtml && (
            <article className={styles.excerpt} dangerouslySetInnerHTML={{ __html: book.excerptHtml }} />
          )}
        </div>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} book={book} format={format} />
    </section>
  );
}