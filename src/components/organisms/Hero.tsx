"use client";
import Link from "next/link";
import Image from "next/image";
import styles from "@/app/page.module.css";
import GoodreadsRating from "@/components/molecules/GoodreadsRating";
import type { Product } from "@/models/Product";
import {getMinPrice} from "@/lib/product-item.helper";
import { useProducts } from "@/components/molecules/ProductsProvider";

export default function Hero({ initialProduct }: { initialProduct?: Product }) {
  const { products } = useProducts();
  
  // Find the live version of the product to get real-time prices
  const liveProduct = initialProduct 
    ? products.find(p => p.id === initialProduct.id) 
    : products[0];

  // Merge live data (prices) with static metadata (description)
  // If we have initialProduct, it's our source for metadata.
  const product = initialProduct 
    ? { ...initialProduct, ...liveProduct, descriptionHtml: initialProduct.descriptionHtml || liveProduct?.descriptionHtml }
    : liveProduct;

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
              <Link href={`/books/${product.slug}`} prefetch={false} className={styles.cta}>
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
          <Image src={product.imageUrl} alt={product.name} width={360} height={540} />
        </div>
      </div>
    </section>
  );
}
