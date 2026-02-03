"use client";
import Link from "next/link";
import Image from "next/image";
import styles from "@/app/page.module.css";
import GoodreadsRating from "@/components/molecules/GoodreadsRating";
import {addBasePath, withCacheBust} from "@/lib/paths";
import type { Product } from "@/models/Product";
import {getMinPrice} from "@/lib/product-item.helper";
import { useProducts } from "@/components/molecules/ProductsProvider";

export default function Hero({ initialProduct }: { initialProduct?: Product }) {
  const { products } = useProducts();
  const product = initialProduct
    ? (products.find(p => p.id === initialProduct.id) || initialProduct)
    : products[0];

  if (!product) return null;
  const minPrice = getMinPrice(product.items);

  return (
    <section className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.copy}>
          <h1>«{product.name}»</h1>
          {product.genre && <p>{product.genre}</p>}

          <>
            {/* Goodreads rating for featured */}
            <GoodreadsRating product={product} />

            {product.descriptionHtml && (
              <div
                className={styles.featuredDescription}
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
            )}

            {minPrice !== null && (
              <p className={styles.featuredLine}>Від {minPrice} грн</p>
            )}

            <div className={styles.actions}>
              <Link href={withCacheBust(`/books/${product.slug}`)} className={styles.cta}>
                Детальніше
              </Link>
            </div>
          </>
        </div>

        <div className={styles.cover}>
          {product.ageRating && (
            <span
              className={`${styles.ageBadge} ${styles["age" + product.ageRating.replace("+", "p")]}`}
              aria-label={`Вікове обмеження: ${product.ageRating}`}
              title={`Вікове обмеження: ${product.ageRating}`}
            >
              {product.ageRating}
            </span>
          )}
          <Image src={addBasePath(product.imageUrl)} alt={product.name} width={360} height={540} />
        </div>
      </div>
    </section>
  );
}
