"use client";

import Link from "next/link";
import styles from "./StorefrontErrorState.module.css";

type StorefrontErrorStateProps =
  | { kind: "not-found"; onRetry?: never }
  | { kind: "error"; onRetry: () => void };

const content = {
  "not-found": {
    eyebrow: "Помилка 404",
    title: "Цю сторінку не знайдено",
    description: "Можливо, посилання застаріло або сторінку було переміщено.",
  },
  error: {
    eyebrow: "Тимчасова помилка",
    title: "Не вдалося завантажити сторінку",
    description: "Схоже, сервіс тимчасово недоступний. Спробуйте ще раз за мить.",
  },
} as const;

export default function StorefrontErrorState(props: StorefrontErrorStateProps) {
  const copy = content[props.kind];

  return (
    <section className={styles.page} aria-labelledby="storefront-error-title">
      <div className={styles.card}>
        <Link className={styles.brand} href="/" aria-label="На головну сторінку">
          <span className={styles.brandMark} aria-hidden="true">ЛК</span>
          <span>Книгарня Лілії Кухарець</span>
        </Link>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1 id="storefront-error-title" className={styles.title}>{copy.title}</h1>
        <p className={styles.description}>{copy.description}</p>
        <div className={styles.actions}>
          {props.kind === "error" && (
            <button className={styles.primaryAction} type="button" onClick={props.onRetry}>
              Спробувати ще раз
            </button>
          )}
          <Link className={styles.secondaryAction} href="/books">
            Повернутися до каталогу
          </Link>
        </div>
      </div>
    </section>
  );
}
