"use client";
import Image from "next/image";
import Link from "next/link";
import styles from "./BookCard.module.css";
import {addBasePath, withCacheBust} from "@/lib/paths";
import {Product} from "@/models/Product";

export default function BookCard({ product }: { product: Product }) {
  const available = product.items.filter(f => f.isAvailable);
  const minPrice = available.length ? Math.min(...available.map(f => f.price)) : null;

  return (
    <Link href={withCacheBust(`/books/${product.slug}`)} className={styles.card}>
      <div className={styles.thumb}>
        {product.ageRating && (
          <span
            className={`${styles.ageBadge} ${styles["age" + product.ageRating.replace("+", "p")]}`}
            aria-label={`Вікове обмеження: ${product.ageRating}`}
            title={`Вікове обмеження: ${product.ageRating}`}
          >
            {product.ageRating}
          </span>
        )}
        <Image src={addBasePath(product.imageUrl)} alt={product.name} width={240} height={360} />
      </div>
      <div className={styles.meta}>
        <h3>{product.name}</h3>
        <p className={styles.price}>{minPrice !== null ? `від ${minPrice} грн` : "Немає в наявності"}</p>
      </div>
    </Link>
  );
}