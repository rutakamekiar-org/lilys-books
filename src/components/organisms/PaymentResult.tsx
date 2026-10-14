"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPaymentConfirmation } from "@/lib/api";
import { isPaymentReference } from "@/lib/payment";
import { useCart } from "@/components/molecules/CartProvider";
import styles from "./PaymentResult.module.css";

type Result = "finishing" | "success" | "failure" | "unconfirmed";
const messages: Record<Result, { title: string; description: string; mark: string }> = {
    finishing: { title: "Завершуємо оплату", description: "Очікуємо підтвердження вашого замовлення.", mark: "…" },
    success: { title: "Оплату підтверджено", description: "Ваше замовлення отримано. Дякуємо за покупку!", mark: "✓" },
    failure: { title: "Оплату не завершено", description: "Не вдалося завершити оплату. Товари залишилися у вашому кошику.", mark: "!" },
    unconfirmed: { title: "Не вдалося підтвердити оплату", description: "Підтвердження ще не отримано. Це не означає, що оплата не відбулася. Кошик збережено. Якщо кошти зарезервовано або списано, не оплачуйте замовлення повторно та зв’яжіться з нами.", mark: "?" },
};

export default function PaymentResult({ returnType = "unknown" }: { returnType?: "success" | "failure" | "unknown" }) {
    const [reference, setReference] = useState<string | null>(null);
    const [revision, setRevision] = useState(0);
    const [confirmation, setConfirmation] = useState<{ reference: string; revision: number; result: Result } | null>(null);
    const { hydrated, finalizePayment, openCart } = useCart();

    useEffect(() => {
        if (returnType !== "success") return;
        const readReference = () => {
            setReference(new URLSearchParams(window.location.hash.slice(1)).get("reference") ?? "");
            setRevision(current => current + 1);
        };
        readReference();
        window.addEventListener("hashchange", readReference);
        return () => window.removeEventListener("hashchange", readReference);
    }, [returnType]);

    useEffect(() => {
        if (returnType !== "success" || !reference || !isPaymentReference(reference)) return;
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout>;
        let remaining = 5;
        const confirm = async () => {
            try {
                // Only saved webhook confirmation is read; this never queries bank status.
                const confirmed = await getPaymentConfirmation(reference, controller.signal);
                if (controller.signal.aborted) return;
                if (confirmed) setConfirmation({ reference, revision, result: "success" });
                else if (--remaining > 0) timer = setTimeout(confirm, 3000);
                else setConfirmation({ reference, revision, result: "unconfirmed" });
            } catch {
                if (!controller.signal.aborted) setConfirmation({ reference, revision, result: "unconfirmed" });
            }
        };
        void confirm();
        return () => { controller.abort(); clearTimeout(timer); };
    }, [reference, revision, returnType]);

    const result: Result = returnType === "failure" ? "failure" : returnType === "unknown" ? "unconfirmed"
        : reference === null ? "finishing" : !isPaymentReference(reference) ? "unconfirmed"
        : confirmation?.reference === reference && confirmation.revision === revision ? confirmation.result : "finishing";
    const message = messages[result];

    useEffect(() => {
        if (hydrated && result === "success" && reference) finalizePayment(reference);
    }, [hydrated, result, reference, finalizePayment]);

    return <section className={styles.page} aria-labelledby="payment-title">
        <div className={styles.card}>
            <div className={styles.mark} aria-hidden="true">{message.mark}</div>
            <div role="status" aria-live="polite" aria-atomic="true">
                <h1 id="payment-title" className={styles.title}>{message.title}</h1>
                <p className={styles.description}>{message.description}</p>
            </div>
            <div className={styles.actions}>
                <Link href="/books" className={styles.primary}>Повернутися до магазину</Link>
                {result === "failure" && <button className={styles.secondary} onClick={() => openCart()}>Переглянути кошик</button>}
                {result === "unconfirmed" && <Link href="mailto:lillykukharets0325@gmail.com" className={styles.secondary}>Зв’язатися з нами</Link>}
            </div>
        </div>
    </section>;
}
