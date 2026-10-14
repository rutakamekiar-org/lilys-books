"use client";
import Icon from "@/components/atoms/Icon";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import styles from "./NavBar.module.css";
import { useCart } from "@/components/molecules/CartProvider";
import ShoppingCart from "@/components/organisms/ShoppingCart";
import dynamic from "next/dynamic";
import type { CheckoutFormData } from "@/components/organisms/CheckoutForm";
import {createInvoice, getInvoiceStatus} from "@/lib/api";
import { getPaymentOutcome, isPaymentReference, paymentReceiptUrl } from "@/lib/payment";

const CheckoutForm = dynamic(() => import("@/components/organisms/CheckoutForm"), { ssr: false });

export default function NavBar() {
  const pathname = usePathname() || "/";
  const cart = useCart();
  const { items, itemCount, updateQuantity, removeItem } = cart;
  const [cartTargetItemId, setCartTargetItemId] = useState<string>();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutInitialized, setCheckoutInitialized] = useState(false);

  const showCart = useCallback((itemId?: string) => {
    setCartTargetItemId(itemId);
    // Warm checkout on the first cart visit, then retain its mounted state and focus lifecycle.
    setCheckoutInitialized(true);
    setCartOpen(true);
  }, []);

  // Register openCart callback in context
  useEffect(() => {
    cart.registerOpenCallback(showCart);
  }, [cart, showCart]);

  const cls = (href: string) =>
    `${styles.link} ${pathname === href ? styles.active : ""}`;

  const handleCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const handleCheckoutSubmit = async (data: CheckoutFormData) => {
    cart.setRecoveryFeedback(null);
    const submittedItems = items;
    const submittedSelection = cart.snapshotSelection();
    const promoCode = cart.appliedPromocode?.code || undefined;
    const existing = cart.findPayment(submittedItems, promoCode);
    if (existing) {
      let outcome;
      try { outcome = getPaymentOutcome((await getInvoiceStatus(existing.reference)).status); }
      catch { outcome = "unverified"; }
      if (!cart.isCurrentSelection(submittedSelection, promoCode)) {
        setCheckoutOpen(false);
        showCart();
        cart.setRecoveryFeedback("Кошик змінився під час перевірки. Перегляньте його ще раз.");
        return;
      }
      if (outcome !== "failed" && outcome !== "canceled") {
        // Show the original invoice amount before resuming or rechecking payment.
        setCheckoutOpen(false);
        window.location.href = paymentReceiptUrl(existing.reference);
        return;
      }
    }
    if (cart.paymentAttempts.length) {
      const review = await cart.prepareRetry();
      if (!review.ready) {
        setCheckoutOpen(false);
        showCart();
        cart.setRecoveryFeedback(review.feedback ?? null);
        return;
      }
    }
    if (!cart.isCurrentSelection(submittedSelection, promoCode)) {
      setCheckoutOpen(false);
      showCart();
      cart.setRecoveryFeedback("Кошик змінився під час перевірки. Перегляньте його ще раз.");
      return;
    }
    const res = await createInvoice(data, submittedItems, promoCode);
    if (!res || typeof res.redirectUrl !== "string" || !res.redirectUrl.trim()) {
      throw new Error("Invalid invoice response");
    }
    setCheckoutOpen(false);
    if (res.reference && res.invoiceId && isPaymentReference(res.reference)) {
      cart.recordPayment({ reference: res.reference, invoiceId: res.invoiceId, paymentUrl: res.redirectUrl,
        items: submittedSelection, promoCode });
    }
    window.location.href = res.redirectUrl;
  };

  return (
    <>
      <nav className={styles.nav} aria-label="Основна навігація">
        <Link href="/" className={cls("/")} aria-current={pathname === "/" ? "page" : undefined}>Головна</Link>
        <Link href="/books" className={cls("/books")} aria-current={pathname === "/books" ? "page" : undefined}>Магазин</Link>
        <Link href="/events" className={cls("/events")} aria-current={pathname === "/events" ? "page" : undefined}>Події</Link>
        <Link href="/about" className={cls("/about")} aria-current={pathname === "/about" ? "page" : undefined}>Про мене</Link>
        <button
          onClick={() => showCart()}
          className={styles.cartBtn}
          aria-label={`Кошик, ${itemCount} товарів`}
        >
          <Icon name="cart-shopping" />
          {itemCount > 0 && <span className={styles.cartBadge}>{itemCount}</span>}
        </button>
      </nav>
      <ShoppingCart
        open={cartOpen}
        targetItemId={cartTargetItemId}
        onClose={() => setCartOpen(false)}
        items={items}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onCheckout={handleCheckout}
      />
      {checkoutInitialized && <CheckoutForm
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={items}
        onSubmit={handleCheckoutSubmit}
        onEditCart={(itemId) => {
          setCheckoutOpen(false);
          showCart(itemId);
        }}
      />}
    </>
  );
}
