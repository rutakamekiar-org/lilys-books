"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./ShoppingCart.module.css";
import { addBasePath } from "@/lib/paths";
import { Product } from "@/models/Product";
import { getPrice } from "@/lib/product-item.helper";
import { useCart } from "@/components/molecules/CartProvider";
import notify from "@/lib/toast";

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastActiveEl = useRef<HTMLElement | null>(null);

  // Close on the Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Restore focus on close
  useEffect(() => {
    if (open) {
      lastActiveEl.current = document.activeElement as HTMLElement;
    } else {
      lastActiveEl.current?.focus?.();
    }
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    const root = dialogRef.current;
    if (!root) return;
    const selector = 'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';
    const getFocusable = () =>
      Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => !el.hasAttribute("disabled")
      );
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const f = getFocusable();
      if (!f.length) return;
      const first = f[0],
        last = f[f.length - 1],
        cur = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (cur === first || !root.contains(cur)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (cur === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onTab);
    return () => document.removeEventListener("keydown", onTab);
  }, [open]);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setIsApplying(true);
    try {
      await applyPromocode(promoInput.trim());
      setPromoInput("");
      notify.success("Промокод застосовано!");
    } catch (e: any) {
      console.error("Promo apply failed:", e);
      notify.error("Невірний або недійсний промокод");
    } finally {
      setIsApplying(false);
    }
  };

  if (!open) return null;

  const subtotal = items.reduce((sum, item) => {
    const productItem = item.product.items.find((i) => i.id === item.itemId);
    const price = productItem ? getPrice(productItem) ?? 0 : 0;
    return sum + price * item.quantity;
  }, 0);

  const total = Math.max(0, subtotal - discountAmount);

  const isEmpty = items.length === 0;

  return (
    <div
      className={styles.overlay}
      aria-modal="true"
      role="dialog"
      aria-label="Кошик"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.cart} ref={dialogRef}>
        <header className={styles.header}>
          <h2 className={styles.title}>Кошик</h2>
          <button
            onClick={onClose}
            aria-label="Закрити"
            className={styles.close}
          >
            ×
          </button>
        </header>

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
                const itemTotal = price * item.quantity;

                const itemDiscount = getItemDiscount(item.itemId);

                return (
                  <div key={item.itemId} className={`${styles.item} ${itemDiscount > 0 ? styles.itemPromo : ''}`}>
                    <div className={styles.itemThumb}>
                      <Image
                        src={addBasePath(item.product.imageUrl)}
                        alt={item.product.name}
                        width={60}
                        height={90}
                      />
                    </div>
                    <div className={styles.itemDetails}>
                      <h3 className={styles.itemTitle}>{item.product.name}</h3>
                      <p className={styles.itemFormat}>
                        {item.format === "paper" ? "Паперова" : "Електронна"}
                      </p>
                      <p className={styles.itemPrice}>{price} грн за шт.</p>
                      {itemDiscount > 0 && (
                        <div className={styles.promoBadge}>
                          <i className="fas fa-tag"></i> Акція (-{itemDiscount} грн)
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
                          <span className={styles.oldPrice}>{itemTotal} грн</span>
                        )}
                        <p className={styles.itemTotal}>{Math.round(itemTotal - itemDiscount)} грн</p>
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
          <>
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
            <footer className={styles.footer}>
              {discountAmount > 0 && (
                <>
                  <div className={styles.summaryRow}>
                    <span>Сума:</span>
                    <span>{subtotal} грн</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Знижка:</span>
                    <span className={styles.discountValue}>-{discountAmount} грн</span>
                  </div>
                </>
              )}
              <div className={styles.total}>
                <span className={styles.totalLabel}>Всього:</span>
                <span className={styles.totalValue}>{total} грн</span>
              </div>
              <button onClick={onCheckout} className={styles.checkoutBtn}>
                Оформити замовлення
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
