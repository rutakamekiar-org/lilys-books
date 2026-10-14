"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getInvoiceStatus } from "@/lib/api";
import { getPaymentOutcome, isPaymentReference, type PaymentOutcome } from "@/lib/payment";
import { formatMoney } from "@/lib/money";
import type { InvoiceStatusResponse } from "@/lib/types";
import styles from "./PaymentResult.module.css";
import { useCart } from "@/components/molecules/CartProvider";

const messages: Record<PaymentOutcome | "checking", { title: string; description: string; mark: string }> = {
    checking: { title: "Перевіряємо оплату", description: "Очікуємо підтвердження стану оплати.", mark: "…" },
    authorized: { title: "Оплату підтверджено", description: "Банк підтвердив резервування коштів. Ваше замовлення отримано. Дякуємо!", mark: "✓" },
    success: { title: "Оплата успішна", description: "Ваше замовлення отримано. Дякуємо за покупку!", mark: "✓" },
    pending: { title: "Оплата ще очікується", description: "Банк ще не підтвердив оплату. Перевірте статус перед повторною спробою.", mark: "…" },
    failed: { title: "Оплата не завершена", description: "Не вдалося завершити оплату або термін рахунку минув. Ви можете переглянути товари та повторити спробу.", mark: "!" },
    canceled: { title: "Оплату скасовано", description: "Оплату скасовано. Ви можете переглянути товари та повторити спробу.", mark: "↩" },
    unverified: { title: "Оплату не підтверджено", description: "Не вдалося перевірити результат оплати. Це не означає, що вона не відбулася. Перевірте статус перед повторною спробою.", mark: "?" },
};

export default function PaymentResult() {
    const [reference, setReference] = useState<string | null>(null);
    const [result, setResult] = useState<{ reference: string; receipt: InvoiceStatusResponse | null; outcome: PaymentOutcome | "checking" } | null>(null);
    const [checking, setChecking] = useState(false);
    const [checkVersion, setCheckVersion] = useState(0);
    const headingRef = useRef<HTMLHeadingElement>(null);
    const focusAfterCheck = useRef(false);
    const { hydrated, paymentAttempts, finalizePayment, reviewPayment, openCart, setRecoveryFeedback } = useCart();
    const [reviewing, setReviewing] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const reviewingRef = useRef(false);

    useEffect(() => {
        const readReference = () => setReference(new URLSearchParams(window.location.hash.slice(1)).get("reference") ?? "");
        readReference();
        window.addEventListener("hashchange", readReference);
        return () => window.removeEventListener("hashchange", readReference);
    }, []);

    useEffect(() => {
        if (reference === null) return;
        if (!isPaymentReference(reference)) {
            setResult(null);
            setChecking(false);
            return;
        }
        setResult({ reference, receipt: null, outcome: "checking" });
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout>;
        let remainingChecks = 5;
        const check = async () => {
            const restoreFocus = focusAfterCheck.current;
            focusAfterCheck.current = false;
            setChecking(true);
            try {
                const result = await getInvoiceStatus(reference, controller.signal);
                if (controller.signal.aborted) return;
                const next = getPaymentOutcome(result.status);
                focusAfterCheck.current = restoreFocus && (next === "success" || next === "authorized");
                setResult({ reference, receipt: result, outcome: next });
                if (next === "pending" && --remainingChecks > 0) timer = setTimeout(check, 3000);
            } catch {
                if (!controller.signal.aborted) setResult({ reference, receipt: null, outcome: "unverified" });
            } finally {
                if (!controller.signal.aborted) setChecking(false);
            }
        };
        void check();
        return () => { controller.abort(); clearTimeout(timer); };
    }, [reference, checkVersion]);

    const currentResult = result?.reference === reference ? result : null;
    const receipt = currentResult?.receipt;
    const outcome = reference === null ? "checking" : !isPaymentReference(reference) ? "unverified" : currentResult?.outcome ?? "checking";
    const message = messages[outcome];
    const confirmed = outcome === "success" || outcome === "authorized";
    const attempt = paymentAttempts.find(candidate => candidate.reference === reference);

    useEffect(() => {
        if (hydrated && confirmed && reference) finalizePayment(reference);
    }, [hydrated, confirmed, reference, finalizePayment]);

    const handleReview = async () => {
        if (!reference || reviewingRef.current) return;
        reviewingRef.current = true;
        setReviewing(true);
        setFeedback(null);
        setRecoveryFeedback(null);
        try {
            const review = await reviewPayment(reference);
            setFeedback(review.feedback ?? null);
            setRecoveryFeedback(review.feedback ?? null);
            if (review.ready) openCart();
            else setCheckVersion(version => version + 1);
        } catch {
            setFeedback("Не вдалося перевірити товари або промокод. Спробуйте ще раз перед повторною оплатою.");
        } finally {
            reviewingRef.current = false;
            setReviewing(false);
        }
    };

    useEffect(() => {
        if (confirmed && focusAfterCheck.current) {
            headingRef.current?.focus();
            focusAfterCheck.current = false;
        }
    }, [confirmed]);

    return <section className={styles.page} aria-labelledby="payment-title">
        <div className={styles.card}>
            <div className={styles.mark} aria-hidden="true">{message.mark}</div>
            <div role="status" aria-live="polite" aria-atomic="true">
                <h1 id="payment-title" className={styles.title} tabIndex={-1} ref={headingRef}>{message.title}</h1>
                <p className={styles.description}>{message.description}</p>
            </div>
            {receipt && <dl className={styles.receipt}>
                <div><dt>Номер замовлення</dt><dd>{receipt.invoiceId}</dd></div>
                <div><dt>Сума замовлення</dt><dd>{formatMoney(receipt.amount / 100)} грн</dd></div>
            </dl>}
            <div className={styles.actions}>
                {!confirmed && attempt && outcome !== "checking" && <button className={outcome === "pending" ? styles.secondary : styles.primary} disabled={reviewing || checking} onClick={handleReview}>
                    {reviewing ? "Перевіряємо товари…" : outcome === "failed" || outcome === "canceled" ? "Переглянути кошик і повторити" : "Переглянути товари"}
                </button>}
                {outcome === "pending" && attempt && <button className={styles.primary} onClick={() => { window.location.href = attempt.paymentUrl; }}>Продовжити оплату</button>}
                {!confirmed && reference && isPaymentReference(reference) && <button className={styles.secondary} disabled={checking} onClick={event => {
                    focusAfterCheck.current = document.activeElement === event.currentTarget;
                    setCheckVersion(version => version + 1);
                }}>{checking ? "Перевіряємо…" : "Перевірити статус"}</button>}
                <Link href="/books" className={confirmed || !attempt ? styles.primary : styles.secondary}>Повернутися до магазину</Link>
                {!confirmed && outcome !== "checking" && (!attempt || feedback) && <button className={styles.secondary} onClick={() => openCart()}>Переглянути поточний кошик</button>}
            </div>
            {feedback && <p role="status" className={styles.feedback}>{feedback}</p>}
        </div>
    </section>;
}
