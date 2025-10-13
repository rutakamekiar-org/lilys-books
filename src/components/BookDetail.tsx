"use client";
import Image from "next/image";
import { useState } from "react";
import type { Book, BookFormat } from "@/lib/types";
import Drawer from "./PurchaseDrawer/Drawer";
import styles from "./BookDetail.module.css";
import GoodreadsRating from "./GoodreadsRating";
import GoodreadsButton from "./GoodreadsButton";
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
          <GoodreadsButton bookId={book.id} />
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

          <GoodreadsRating bookId={book.id} compact />

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

      <Drawer open={open} onCloseAction={() => setOpen(false)} book={book} format={format} />
    </section>
  );
}