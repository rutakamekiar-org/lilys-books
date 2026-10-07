"use client";
import Link from "next/link";
import Image from "next/image";
import styles from "@/app/page.module.css";
import GoodreadsRating from "@/components/molecules/GoodreadsRating";
import type { Product } from "@/models/Product";
import {getMinPrice} from "@/lib/product-item.helper";
import { useProducts } from "@/components/molecules/ProductsProvider";
import ProductsDataState from "./ProductsDataState";

export default function Hero({ initialProduct }: { initialProduct?: Product }) {
  const { products } = useProducts();
  
  // Find the live version of the product to get real-time prices
  const liveProduct = initialProduct 
    ? products.find(p => p.id === initialProduct.id) 
    : products.find(p => p.isHero) ?? products[0];

  const product = initialProduct 
    ? liveProduct ?? initialProduct
    : liveProduct;

  if (!product) return <ProductsDataState />;
  const minPrice = getMinPrice(product.items);
  const description = product.description && (
    <div className={styles.featuredDescription}>{product.description}</div>
  );

  return (
    <section className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.copy}>
          <h1>«{product.name}»</h1>
          {product.genre && <p>{product.genre}</p>}

          <>
            {/* Only one supporting block is displayed at each breakpoint, so
                reading order follows the offer's mobile and desktop placement. */}
            <div className={styles.desktopSupporting}>
              <GoodreadsRating product={product} />
              {description}
            </div>
            <div className={styles.mobileRating}>
              <GoodreadsRating product={product} part="rating" />
            </div>

            {minPrice !== null && (
              <p className={styles.featuredLine}>Від {minPrice} грн</p>
            )}

            <div className={styles.actions}>
              <Link href={`/books/${product.slug}`} prefetch={false} className={styles.cta}>
                Детальніше
              </Link>
            </div>

            <div className={styles.mobileSupporting}>
              <GoodreadsRating product={product} part="reviews" />
              {description}
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
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={360}
            height={540}
            sizes="(max-width: 560px) calc(100vw - 58px), (max-width: 640px) calc(100vw - 82px), (max-width: 980px) calc(100vw - 90px), 360px"
            preload
          />
        </div>
      </div>
    </section>
  );
}
