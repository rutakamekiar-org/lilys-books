"use client";
import { useId, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./SuggestionDialog.module.css";
import { Product } from "@/models/Product";
import { useCart } from "@/components/molecules/CartProvider";
import notify from "@/lib/toast";
import { useDialogA11y } from "@/lib/dialog-a11y";
import { canPurchase, getPrice } from "@/lib/product-item.helper";
import PreorderLabel from "@/components/atoms/PreorderLabel";

interface SuggestionDialogProps {
  open: boolean;
  onClose: () => void;
  suggestedProduct: Product;
  suggestedItemId: string | null;
}

export default function SuggestionDialog({ open, onClose, suggestedProduct, suggestedItemId }: SuggestionDialogProps) {
  const { addItem, openCart } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const unavailableId = useId();

  useDialogA11y({ open, onClose, dialogRef: panelRef });

  if (!open) return null;

  const item = suggestedProduct.items.find(item => item.id === suggestedItemId);
  const eligible = item?.type === 1 && canPurchase(item);

  const handleAddSuggested = () => {
    if (item && eligible) {
      addItem(suggestedProduct, item.id, "paper", 1);
      notify.success(`"${suggestedProduct.name}" додано до кошика`);
      onClose();
      openCart();
    }
  };

  const productUrl = `/books/${suggestedProduct.slug}`;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel} ref={panelRef}>
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>Разом цікавіше?</h2>
          <button aria-label="Закрити" className={styles.close} onClick={onClose}>×</button>
        </div>
        <div className={styles.body}>
          <p className={styles.message}>До Вашої книги ідеально підійдуть ці ілюстрації:</p>
          <div className={styles.product}>
            <Link href={productUrl} prefetch={false} className={styles.image} onClick={onClose}>
                <Image src={suggestedProduct.imageUrl} alt={suggestedProduct.name} width={120} height={180} sizes="120px" />
            </Link>
            <div className={styles.info}>
                <Link href={productUrl} prefetch={false} className={styles.productTitle} onClick={onClose}>
                    <h3>{suggestedProduct.name}</h3>
                </Link>
                {item && <p className={styles.price}>{getPrice(item)} грн</p>}
                <PreorderLabel item={item} />
                {!eligible && (
                  <p id={unavailableId} role="status" className={styles.unavailable}>
                    Це видання більше не доступне для покупки або передзамовлення.
                  </p>
                )}
                <button className={styles.addButton} disabled={!eligible}
                        aria-describedby={!eligible ? unavailableId : undefined}
                        onClick={handleAddSuggested}>Додати до кошика</button>
                <Link href={productUrl} prefetch={false} className={styles.detailsLink} onClick={onClose}>
                    Детальніше
                </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
