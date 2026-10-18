"use client";

import { useEffect } from "react";
import Icon from "@/components/atoms/Icon";
import Button from "@/components/atoms/Button";
import { useCart } from "@/components/molecules/CartProvider";
import styles from "./PaymentResult.module.css";

const CONTACT_EMAIL = "lillykukharets0325@gmail.com";
const contactLink = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

// Monobank only sends customers to the success URL after a successful payment. Fulfillment never
// depends on this page: it is driven by the signed webhook, so the page just thanks and clears the cart.
export default function PaymentResult({ returnType }: { returnType: "success" | "failure" }) {
    const { hydrated, clearCart, openCart } = useCart();
    const success = returnType === "success";

    useEffect(() => {
        // Wait for the stored cart to load, otherwise loading it would undo the clear.
        if (success && hydrated) clearCart();
    }, [success, hydrated, clearCart]);

    return <section className={styles.page} aria-labelledby="payment-title">
        <div className={styles.card}>
            <div className={`${styles.mark} ${success ? styles.markSuccess : styles.markFailure}`} aria-hidden="true">
                <Icon name={success ? "check" : "exclamation"} />
            </div>
            {success ? <>
                <h1 id="payment-title" className={styles.title}>Дякуємо за покупку!</h1>
                <p className={styles.description}>Оплату отримано. Підтвердження замовлення надійде на вашу електронну пошту.</p>
                <p className={styles.hint}>Якщо лист не прийшов протягом кількох хвилин, перевірте папку «Спам» або напишіть нам на {contactLink}.</p>
                <div className={styles.actions}>
                    <Button href="/books" className={styles.action}>Повернутися до магазину</Button>
                </div>
            </> : <>
                <h1 id="payment-title" className={styles.title}>Оплату не завершено</h1>
                <p className={styles.description}>Не вдалося завершити оплату. Товари залишилися у вашому кошику.</p>
                <p className={styles.hint}>Якщо кошти все ж були списані, напишіть нам на {contactLink}, і ми все перевіримо.</p>
                <div className={styles.actions}>
                    <Button className={styles.action} onClick={() => openCart()}>Спробувати ще раз</Button>
                    <Button variant="secondary" href="/books" className={styles.action}>Повернутися до магазину</Button>
                </div>
            </>}
        </div>
    </section>;
}
