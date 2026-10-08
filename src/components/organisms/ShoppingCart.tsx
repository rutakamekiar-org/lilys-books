"use client";
import Icon from "@/components/atoms/Icon";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import styles from "./ShoppingCart.module.css";
import { Product } from "@/models/Product";
import { getPrice, getProductItemDisplayLabel } from "@/lib/product-item.helper";
import { useCart } from "@/components/molecules/CartProvider";
import notify from "@/lib/toast";
import { useSheetDismiss } from "@/lib/sheet-dismiss";
import { useDialogA11y } from "@/lib/dialog-a11y";
import { formatMoney, multiplyMoney, subtractMoney, sumMoney } from "@/lib/money";
import PreorderLabel from "@/components/atoms/PreorderLabel";
import type { ApiError } from "@/models/ApiError";

export interface CartItem {
  product: Product;
  itemId: string;
  quantity: number;
  format: "paper" | "digital";
}

interface ShoppingCartProps {
  open: boolean;
  targetItemId?: string;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
}

export default function ShoppingCart({
  open,
  targetItemId,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: ShoppingCartProps) {
  const { appliedPromocode, discountAmount, getItemDiscount, applyPromocode, removePromocode } = useCart();
  const [promoInput, setPromoInput] = useState("");
  const [applyingAction, setApplyingAction] = useState<"apply" | "retry" | null>(null);
  const isApplying = applyingAction !== null;
  const [promoFailure, setPromoFailure] = useState<"invalid" | "temporary" | null>(null);
  const applyingRef = useRef(false);
  const promoFeedbackId = useId();
  const [mounted, setMounted] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const { dragHandleProps, dragStyle } = useSheetDismiss(onClose);

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

  useEffect(() => {
    if (!open || !mounted) return;
    const frame = requestAnimationFrame(() => {
      const content = dialogRef.current?.querySelector(`.${styles.content}`);
      const target = targetItemId && Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("[data-cart-item-id]") ?? [])
        .find(node => node.dataset.cartItemId === targetItemId);
      if (content instanceof HTMLElement) content.scrollTop = 0;
      if (target) target.scrollIntoView({ block: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, mounted, targetItemId]);

  const handleApplyPromo = async () => {
    if (applyingRef.current || !promoInput.trim()) return;
    applyingRef.current = true;
    setApplyingAction(promoFailure === "temporary" ? "retry" : "apply");
    setPromoFailure(null);
    try {
      await applyPromocode(promoInput.trim());
      setPromoInput("");
      notify.success("Промокод застосовано!");
    } catch (e: unknown) {
      const status = (e as ApiError | null)?.status;
      setPromoFailure(status === 400 || status === 404 || status === 422 ? "invalid" : "temporary");
    } finally {
      applyingRef.current = false;
      setApplyingAction(null);
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
      <div className={styles.cart} ref={dialogRef} style={dragStyle}>
        <div className={styles.header} {...dragHandleProps}>
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
              <button className={styles.continueShopping} onClick={onClose}><Icon name="arrow-left" /> Продовжити покупки</button>
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
                  <div key={item.itemId} data-cart-item-id={item.itemId} role="group" aria-label={`${item.product.name}, ${item.format === "paper" ? "Паперова" : "Електронна"}`} className={`${styles.item} ${itemDiscount > 0 ? styles.itemPromo : ''}`}>
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
                      <PreorderLabel item={productItem} />
                      <p className={styles.itemPrice}>{formatMoney(price)} грн за шт.</p>
                      {itemDiscount > 0 && (
                        <div className={styles.promoBadge}>
                          <Icon name="tag" /> Акція (-{formatMoney(itemDiscount)} грн)
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
                        <Icon name="trash" />
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
                    <Icon name="tag" style={{ marginRight: '8px' }} />
                    {appliedPromocode.code?.toUpperCase()}
                  </span>
                  <button onClick={removePromocode} className={styles.removePromo} aria-label="Видалити промокод">
                    ×
                  </button>
                </div>
              ) : (
                <div className={styles.promoForm} aria-busy={isApplying}>
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value);
                      setPromoFailure(null);
                    }}
                    readOnly={isApplying}
                    placeholder="Введіть промокод"
                    aria-label="Промокод"
                    aria-invalid={promoFailure === "invalid"}
                    aria-describedby={promoFailure ? promoFeedbackId : undefined}
                    className={styles.promoInput}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={isApplying || !promoInput.trim()}
                    className={`${styles.promoApplyBtn} ${promoFailure === "temporary" || applyingAction === "retry" ? styles.promoRetryBtn : ""}`}
                    aria-label={isApplying ? "Перевіряємо промокод" : undefined}
                  >
                    {isApplying ? <Icon name="spinner" spin /> : promoFailure === "temporary" ? "Повторити" : "Застосувати"}
                  </button>
                </div>
              )}
              {!appliedPromocode && promoFailure && (
                <p id={promoFeedbackId} role="alert" className={styles.promoFeedback}>
                  {promoFailure === "invalid"
                    ? "Невірний або недійсний промокод. Перевірте код або введіть інший."
                    : "Не вдалося перевірити промокод через тимчасову помилку. Спробуйте ще раз."}
                </p>
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
            <button className={styles.continueShopping} onClick={onClose}><Icon name="arrow-left" /> Продовжити покупки</button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
