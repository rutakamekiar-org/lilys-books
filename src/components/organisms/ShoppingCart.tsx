"use client";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import styles from "./ShoppingCart.module.css";
import { Product } from "@/models/Product";
import { getPrice, getProductItemDisplayLabel } from "@/lib/product-item.helper";
import { useCart } from "@/components/molecules/CartProvider";
import notify from "@/lib/toast";
import { useDialogA11y } from "@/lib/dialog-a11y";
import { formatMoney, multiplyMoney, subtractMoney, sumMoney } from "@/lib/money";

export interface CartItem {
  product: Product;
  itemId: string;
  quantity: number;
  format: "paper" | "digital";
}

interface ShoppingCartProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
}

export default function ShoppingCart({
  open,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: ShoppingCartProps) {
  const { appliedPromocode, discountAmount, getItemDiscount, applyPromocode, removePromocode } = useCart();
  const [promoInput, setPromoInput] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // The dialog only exists once mounted, so focus management waits for the portal.
  useDialogA11y({ open: open && mounted, onClose, dialogRef, lockScroll: true });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const updateViewportHeight = () => {
      const nextHeight = window.visualViewport?.height ?? window.innerHeight;
      setViewportHeight(Math.round(nextHeight));
    };

    updateViewportHeight();
    window.visualViewport?.addEventListener("resize", updateViewportHeight);
    window.visualViewport?.addEventListener("scroll", updateViewportHeight);
    window.addEventListener("resize", updateViewportHeight);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewportHeight);
      window.visualViewport?.removeEventListener("scroll", updateViewportHeight);
      window.removeEventListener("resize", updateViewportHeight);
    };
  }, [open]);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setIsApplying(true);
    try {
      await applyPromocode(promoInput.trim());
      setPromoInput("");
      notify.success("Промокод застосовано!");
    } catch (e: unknown) {
      console.error("Promo apply failed:", e);
      notify.error("Невірний або недійсний промокод");
    } finally {
      setIsApplying(false);
    }
  };

  if (!open || !mounted) return null;

  const subtotal = sumMoney(items.map((item) => {
    const productItem = item.product.items.find((i) => i.id === item.itemId);
    const price = productItem ? getPrice(productItem) ?? 0 : 0;
    return multiplyMoney(price, item.quantity);
  }));

  const total = subtractMoney(subtotal, discountAmount);

  const isEmpty = items.length === 0;
  const overlayStyle = viewportHeight
    ? ({ ["--cart-viewport-height"]: `${viewportHeight}px` } as { [key: string]: string })
    : undefined;

  return createPortal(
    <div
      className={styles.overlay}
      style={overlayStyle}
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.cart} ref={dialogRef}>
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>Кошик</h2>
          <button
            onClick={onClose}
            aria-label="Закрити"
            className={styles.close}
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          {isEmpty ? (
            <div className={styles.empty}>
              <p>Ваш кошик порожній</p>
            </div>
          ) : (
            <div className={styles.items}>
              {items.map((item) => {
                const productItem = item.product.items.find(
                  (i) => i.id === item.itemId
                );
                const price = productItem ? getPrice(productItem) ?? 0 : 0;
                const itemTotal = multiplyMoney(price, item.quantity);

                const itemDiscount = getItemDiscount(item.itemId);

                return (
                  <div key={item.itemId} className={`${styles.item} ${itemDiscount > 0 ? styles.itemPromo : ''}`}>
                    <div className={styles.itemThumb}>
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        width={60}
                        height={90}
                        sizes="60px"
                      />
                    </div>
                    <div className={styles.itemDetails}>
                      <h3 className={styles.itemTitle}>{item.product.name}</h3>
                      <p className={styles.itemFormat}>
                        {productItem
                          ? getProductItemDisplayLabel(item.product, productItem)
                          : item.format === "paper" ? "Паперова" : "Електронна"}
                      </p>
                      <p className={styles.itemPrice}>{formatMoney(price)} грн за шт.</p>
                      {itemDiscount > 0 && (
                        <div className={styles.promoBadge}>
                          <i className="fas fa-tag"></i> Акція (-{formatMoney(itemDiscount)} грн)
                        </div>
                      )}
                      {item.format === "paper" && (
                        <div className={styles.quantityRow}>
                          <span className={styles.quantityLabel}>Кількість:</span>
                          <div className={styles.quantity}>
                            <button
                              onClick={() =>
                                onUpdateQuantity(
                                  item.itemId,
                                  Math.max(1, item.quantity - 1)
                                )
                              }
                              aria-label="Зменшити кількість"
                              className={styles.quantityBtn}
                            >
                              −
                            </button>
                            <span className={styles.quantityValue}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                onUpdateQuantity(item.itemId, item.quantity + 1)
                              }
                              aria-label="Збільшити кількість"
                              className={styles.quantityBtn}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={styles.itemActions}>
                      <div className={styles.itemTotalContainer}>
                        {itemDiscount > 0 && (
                          <span className={styles.oldPrice}>{formatMoney(itemTotal)} грн</span>
                        )}
                        <p className={styles.itemTotal}>{formatMoney(subtractMoney(itemTotal, itemDiscount))} грн</p>
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.itemId)}
                        aria-label="Видалити з кошика"
                        className={styles.removeBtn}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!isEmpty && (
          <div className={styles.footer}>
            <div className={styles.promocode}>
              {appliedPromocode ? (
                <div className={styles.appliedPromo}>
                  <span>
                    <i className="fas fa-tag" style={{ marginRight: '8px' }}></i>
                    {appliedPromocode.code?.toUpperCase()}
                  </span>
                  <button onClick={removePromocode} className={styles.removePromo} aria-label="Видалити промокод">
                    ×
                  </button>
                </div>
              ) : (
                <div className={styles.promoForm}>
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Введіть промокод"
                    aria-label="Промокод"
                    className={styles.promoInput}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={isApplying || !promoInput.trim()}
                    className={styles.promoApplyBtn}
                  >
                    {isApplying ? <i className="fas fa-spinner fa-spin"></i> : 'Застосувати'}
                  </button>
                </div>
              )}
            </div>
            {discountAmount > 0 && (
              <>
                <div className={styles.summaryRow}>
                  <span>Сума:</span>
                  <span>{formatMoney(subtotal)} грн</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Знижка:</span>
                  <span className={styles.discountValue}>-{formatMoney(discountAmount)} грн</span>
                </div>
              </>
            )}
            <div className={styles.total}>
              <span className={styles.totalLabel}>Всього:</span>
              <span className={styles.totalValue}>{formatMoney(total)} грн</span>
            </div>
            <button onClick={onCheckout} className={styles.checkoutBtn}>
              Оформити замовлення
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
