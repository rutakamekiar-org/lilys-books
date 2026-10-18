"use client";
import { useEffect, useId, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./SuggestionDialog.module.css";
import { Product } from "@/models/Product";
import { useCart } from "@/components/molecules/CartProvider";
import notify from "@/lib/toast";
import Button from "@/components/atoms/Button";
import Dialog from "@/components/molecules/Dialog";
import { canPurchase, getPrice } from "@/lib/product-item.helper";
import PreorderLabel from "@/components/atoms/PreorderLabel";
import Icon from "@/components/atoms/Icon";

interface SuggestionDialogProps {
  open: boolean;
  onClose: () => void;
  suggestedProduct: Product;
  suggestedItemId: string | null;
}

export default function SuggestionDialog({ open, onClose, suggestedProduct, suggestedItemId }: SuggestionDialogProps) {
  const { addItem, openCart } = useCart();
  const unavailableId = useId();
  const selectedId = useId();
  const actionHandled = useRef(false);

  useEffect(() => {
    if (open) actionHandled.current = false;
  }, [open]);

  if (!open) return null;

  const item = suggestedProduct.items.find(item => item.id === suggestedItemId);
  const eligible = item?.type === 1 && canPurchase(item);

  const handleAddSuggested = () => {
    if (item && eligible && !actionHandled.current) {
      actionHandled.current = true;
      addItem(suggestedProduct, item.id, "paper", 1);
      notify.success(`"${suggestedProduct.name}" додано до кошика`);
      onClose();
      openCart();
    }
  };

  const handleContinue = () => {
    if (actionHandled.current) return;
    actionHandled.current = true;
    onClose();
    openCart();
  };

  const productUrl = `/books/${suggestedProduct.slug}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Разом цікавіше?"
      classNames={{ overlay: styles.overlay, panel: styles.panel, header: styles.header, title: styles.title }}
    >
      <div className={styles.body}>
        <p className={styles.message}>Доповніть книгу ілюстраціями:</p>
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
              <Button fullWidth disabled={!eligible}
                      aria-describedby={!eligible ? unavailableId : undefined}
                      onClick={handleAddSuggested}>Додати до кошика</Button>
              <Link href={productUrl} prefetch={false} className={styles.detailsLink} onClick={onClose}>
                  Детальніше
              </Link>
          </div>
        </div>
        <div className={styles.continuation}>
          <p id={selectedId} className={styles.selectedNote}>
            <span className={styles.confirmationIcon} aria-hidden="true"><Icon name="check" /></span>
            <span>Книгу додано до кошика</span>
          </p>
          <button className={styles.continueButton} aria-describedby={selectedId}
                  onClick={handleContinue}>Перейти до кошика</button>
        </div>
      </div>
    </Dialog>
  );
}
