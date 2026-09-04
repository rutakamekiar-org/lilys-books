"use client";
import Image from "next/image";
import Link from "next/link";
import styles from "./BookCard.module.css";
import {Product} from "@/models/Product";
import {getPrice, getProductItemDisplayLabel} from "@/lib/product-item.helper";
import { useProducts } from "@/components/molecules/ProductsProvider";
import {getFormat} from "@/lib/types";
import {useCart} from "@/components/molecules/CartProvider";
import notify from "@/lib/toast";

export default function BookCard({ product: staticProduct }: { product: Product }) {
  const { products } = useProducts();
  const { addItem, isInCart, openCart } = useCart();
  const product = products.find(p => p.id === staticProduct.id) || staticProduct;
  const formatItems = [...product.items].sort((a, b) => a.type - b.type);

  const handleQuickAdd = (itemId: string) => {
    const item = product.items.find(i => i.id === itemId);
    if (!item || (!item.isAvailable && !item.canPreorder)) return;

    const format = getFormat(item);
    if (isInCart(item.id)) {
      openCart();
    } else {
      addItem(product, item.id, format, 1);
      notify.success(`"${product.name}" додано до кошика`);
    }
  };

  return (
    <article className={styles.card}>
      <Link href={`/books/${product.slug}`} prefetch={false} className={styles.productLink}>
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
          <Image src={product.imageUrl} alt={product.name} width={240} height={360} />
        </div>
        <div className={styles.meta}>
          <h3>{product.name}</h3>
        </div>
      </Link>
      <div className={styles.formats} role="group" aria-label={`Формати книги ${product.name}`}>
        {formatItems.map(item => {
          const label = getProductItemDisplayLabel(product, item);
          const isAvailable = item.isAvailable || item.canPreorder;
          const itemInCart = isInCart(item.id);

          return (
            <div
              key={item.id}
              className={`${styles.formatRow} ${!isAvailable ? styles.unavailable : ""}`}
            >
              <span className={styles.formatText}>
                <span className={styles.formatName}>{label}</span>
                <span className={styles.formatPrice}>{getPrice(item)} грн</span>
              </span>
              <button
                type="button"
                className={`${styles.quickAdd} ${itemInCart ? styles.inCart : ""}`}
                disabled={!isAvailable}
                onClick={() => handleQuickAdd(item.id)}
                aria-label={`${itemInCart ? "Вже в кошику" : "Додати в кошик"}: ${label}, ${product.name}`}
                title={itemInCart ? "Вже в кошику" : "Додати в кошик"}
              >
                <i className={itemInCart ? "fas fa-check" : "fas fa-cart-plus"} aria-hidden="true"></i>
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}
