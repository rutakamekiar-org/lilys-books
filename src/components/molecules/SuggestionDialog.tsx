"use client";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./SuggestionDialog.module.css";
import { addBasePath, withCacheBust } from "@/lib/paths";
import { Product } from "@/models/Product";
import { useCart } from "@/components/molecules/CartProvider";
import notify from "@/lib/toast";

interface SuggestionDialogProps {
  open: boolean;
  onClose: () => void;
  suggestedProduct: Product;
}

export default function SuggestionDialog({ open, onClose, suggestedProduct }: SuggestionDialogProps) {
  const { addItem, openCart } = useCart();

  // close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleAddSuggested = () => {
    const paperItem = suggestedProduct.items.find(i => i.type === 1);
    if (paperItem) {
      addItem(suggestedProduct, paperItem.id, "paper", 1);
      notify.success(`"${suggestedProduct.name}" додано до кошика`);
      onClose();
      openCart();
    }
  };

  const item = suggestedProduct.items[0];
  if (!item) return null;
  const price = item.discountPrice || item.price;
  const productUrl = withCacheBust(`/books/${suggestedProduct.slug}`);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <header className={styles.header}>
          <h3 className={styles.title}>Разом цікавіше?</h3>
          <button aria-label="Закрити" className={styles.close} onClick={onClose}>×</button>
        </header>
        <div className={styles.body}>
          <p className={styles.message}>До Вашої книги ідеально підійдуть ці ілюстрації:</p>
          <div className={styles.product}>
            <Link href={productUrl} className={styles.image} onClick={onClose}>
                <Image src={addBasePath(suggestedProduct.imageUrl)} alt={suggestedProduct.name} width={120} height={180} />
            </Link>
            <div className={styles.info}>
                <Link href={productUrl} className={styles.productTitle} onClick={onClose}>
                    <h4>{suggestedProduct.name}</h4>
                </Link>
                <p className={styles.price}>{price} грн</p>
                <button className={styles.addButton} onClick={handleAddSuggested}>Додати до кошика</button>
                <Link href={productUrl} className={styles.detailsLink} onClick={onClose}>
                    Детальніше
                </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
