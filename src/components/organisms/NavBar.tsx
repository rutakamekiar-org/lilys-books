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
import notify from "@/lib/toast";
import {createInvoice} from "@/lib/api";

const CheckoutForm = dynamic(() => import("@/components/organisms/CheckoutForm"), { ssr: false });

export default function NavBar() {
  const pathname = usePathname() || "/";
  const cart = useCart();
  const { items, itemCount, updateQuantity, removeItem, clearCart } = cart;
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutInitialized, setCheckoutInitialized] = useState(false);

  const showCart = useCallback(() => {
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
    try {
      // Simulate API request
        const res = await createInvoice(data, items, cart.appliedPromocode?.code || undefined)
        setCheckoutOpen(false);
        clearCart();
        window.location.href = res.redirectUrl;
    } catch (error) {
      console.error("Order submission failed:", error);
      notify.error("Помилка при оформленні замовлення. Спробуйте ще раз.");
    }
  };

  return (
    <>
      <nav className={styles.nav} aria-label="Основна навігація">
        <Link href="/" className={cls("/")} aria-current={pathname === "/" ? "page" : undefined}>Головна</Link>
        <Link href="/books" className={cls("/books")} aria-current={pathname === "/books" ? "page" : undefined}>Магазин</Link>
        <Link href="/events" className={cls("/events")} aria-current={pathname === "/events" ? "page" : undefined}>Події</Link>
        <Link href="/about" className={cls("/about")} aria-current={pathname === "/about" ? "page" : undefined}>Про мене</Link>
        <button
          onClick={showCart}
          className={styles.cartBtn}
          aria-label={`Кошик, ${itemCount} товарів`}
        >
          <Icon name="cart-shopping" />
          {itemCount > 0 && <span className={styles.cartBadge}>{itemCount}</span>}
        </button>
      </nav>
      <ShoppingCart
        open={cartOpen}
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
      />}
    </>
  );
}
