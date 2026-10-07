"use client";

import Link from "next/link";
import styles from "./StorefrontErrorState.module.css";

type StorefrontErrorStateProps =
  | { kind: "not-found"; onRetry?: never }
  | { kind: "error"; onRetry: () => void }
  | { kind: "catalog-error"; onRetry: () => void; headingLevel?: 1 | 2 };

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
  "catalog-error": {
    eyebrow: "Тимчасова помилка",
    title: "Не вдалося завантажити книги",
    description: "Схоже, сервіс тимчасово недоступний. Спробуйте ще раз за мить.",
  },
} as const;

export default function StorefrontErrorState(props: StorefrontErrorStateProps) {
  const copy = content[props.kind];
  const Heading = props.kind === "catalog-error" && props.headingLevel === 2 ? "h2" : "h1";

  return (
    <section className={styles.page} aria-labelledby="storefront-error-title">
      <div className={styles.card}>
        <Link className={styles.brand} href="/" aria-label="На головну сторінку">
          <span className={styles.brandMark} aria-hidden="true">ЛК</span>
          <span>Книгарня Лілії Кухарець</span>
        </Link>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <Heading id="storefront-error-title" className={styles.title}>{copy.title}</Heading>
        <p className={styles.description}>{copy.description}</p>
        <div className={styles.actions}>
          {props.kind !== "not-found" && (
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
