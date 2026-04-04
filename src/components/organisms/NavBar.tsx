"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "./NavBar.module.css";
import { withCacheBust } from "@/lib/paths";
import { useCart } from "@/components/molecules/CartProvider";
import ShoppingCart from "@/components/organisms/ShoppingCart";
import CheckoutForm, { CheckoutFormData } from "@/components/organisms/CheckoutForm";
import notify from "@/lib/toast";
import {createInvoice} from "@/lib/api";

export default function NavBar() {
  const pathname = usePathname() || "/";
  const cart = useCart();
  const { items, itemCount, updateQuantity, removeItem, clearCart } = cart;
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Register openCart callback in context
  useEffect(() => {
    cart.registerOpenCallback(() => setCartOpen(true));
  }, [cart]);

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
      <nav className={styles.nav}>
        <Link href={withCacheBust("/")} className={cls("/")} aria-current={pathname === "/" ? "page" : undefined}>Головна</Link>
        <Link href={withCacheBust("/books")} className={cls("/books")} aria-current={pathname === "/books" ? "page" : undefined}>Магазин</Link>
        <Link href={withCacheBust("/events")} className={cls("/events")} aria-current={pathname === "/events" ? "page" : undefined}>Події</Link>
        <Link href={withCacheBust("/about")} className={cls("/about")} aria-current={pathname === "/about" ? "page" : undefined}>Про мене</Link>
        <button
          onClick={() => setCartOpen(true)}
          className={styles.cartBtn}
          aria-label={`Кошик, ${itemCount} товарів`}
        >
          <i className="fas fa-shopping-cart"></i>
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
      <CheckoutForm
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={items}
        onSubmit={handleCheckoutSubmit}
      />
    </>
  );
}