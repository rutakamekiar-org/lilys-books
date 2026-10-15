"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/components/molecules/CartProvider";
import styles from "./PaymentResult.module.css";

const messages = {
    success: { title: "Дякуємо за покупку!", description: "Оплату отримано. Підтвердження замовлення надійде на вашу електронну пошту.", mark: "✓" },
    failure: { title: "Оплату не завершено", description: "Не вдалося завершити оплату. Товари залишилися у вашому кошику.", mark: "!" },
};

// Monobank only sends customers to the success URL after a successful payment. Fulfillment never
// depends on this page: it is driven by the signed webhook, so the page just thanks and clears the cart.
export default function PaymentResult({ returnType }: { returnType: "success" | "failure" }) {
    const { hydrated, clearCart, openCart } = useCart();
    const message = messages[returnType];

    useEffect(() => {
        // Wait for the stored cart to load, otherwise loading it would undo the clear.
        if (returnType === "success" && hydrated) clearCart();
    }, [returnType, hydrated, clearCart]);

    return <section className={styles.page} aria-labelledby="payment-title">
        <div className={styles.card}>
            <div className={styles.mark} aria-hidden="true">{message.mark}</div>
            <h1 id="payment-title" className={styles.title}>{message.title}</h1>
            <p className={styles.description}>{message.description}</p>
            <div className={styles.actions}>
                <Link href="/books" className={styles.primary}>Повернутися до магазину</Link>
                {returnType === "failure" && <button className={styles.secondary} onClick={() => openCart()}>Переглянути кошик</button>}
            </div>
        </div>
    </section>;
}
