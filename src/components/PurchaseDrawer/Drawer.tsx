"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import { createPaperCheckoutMock as createPaperCheckout, createDigitalInvoiceMock as createDigitalInvoice } from "@/lib/api.mock";
import type { Book, BookFormat } from "@/lib/types";
import styles from "./Drawer.module.css";
import { addBasePath } from "@/lib/paths";

export default function Drawer({
  open, onClose, book, format,
}: { open: boolean; onClose: () => void; book: Book; format: BookFormat; }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastActiveEl = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape" && open) onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      lastActiveEl.current = document.activeElement as HTMLElement;
      setErrors({});
      setLoading(false);
      if (format === "digital") {
        setTimeout(() => firstFieldRef.current?.focus(), 0);
      }
    } else {
      lastActiveEl.current?.focus?.();
    }
  }, [open, format]);

  // focus trap
  useEffect(() => {
    if (!open) return;
    const root = dialogRef.current;
    if (!root) return;
    const selector = 'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';
    const getFocusable = () => Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(el => !el.hasAttribute("disabled"));
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const f = getFocusable();
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1], cur = document.activeElement as HTMLElement | null;
      if (e.shiftKey) { if (cur === first || !root.contains(cur)) { e.preventDefault(); last.focus(); } }
      else { if (cur === last) { e.preventDefault(); first.focus(); } }
    };
    document.addEventListener("keydown", onTab);
    return () => document.removeEventListener("keydown", onTab);
  }, [open]);

  const validEmail = useMemo(() => /^\S+@\S+\.\S+$/.test(email), [email]);
  const validPhone = useMemo(() => /^\+?\d{10,14}$/.test(phone), [phone]);
  const digitalValid = format === "paper" ? true : (validEmail && validPhone);

  if (!open) return null;

  const onPurchase = async () => {
    try {
      setErrors({});
      setLoading(true);
      if (format === "paper") {
        const res = await createPaperCheckout(book.id, 1);
        window.location.href = res.redirectUrl;
        return;
      }
      const newErrors: { email?: string; phone?: string } = {};
      if (!validEmail) newErrors.email = "Введіть дійсний email";
      if (!validPhone) newErrors.phone = "Введіть дійсний телефон (10–14 цифр, можна з +)";
      if (newErrors.email || newErrors.phone) {
        setErrors(newErrors);
        setLoading(false);
        return;
      }
      const res = await createDigitalInvoice({ productId: "mock", customerEmail: email.trim(), customerPhone: phone.trim() });
      window.location.href = res.redirectUrl;
    } catch {
      setLoading(false);
    }
  };

  const isPaper = format === "paper";

  return (
    <div className={styles.overlay} aria-modal="true" role="dialog" aria-label="Оформлення замовлення" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.sheet} ref={dialogRef}>
        <header className={styles.header}>
          <h3>{book.title} — {isPaper ? "Паперова" : "Електронна"}</h3>
          <button onClick={onClose} aria-label="Закрити" className={styles.close}>×</button>
        </header>

        {/* Content */}
        <div className={styles.content}>
          {!isPaper ? (
            <>
              <label>Email
                <input
                  ref={firstFieldRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "err-email" : undefined}
                />
                {errors.email && <small id="err-email" className={styles.error}>{errors.email}</small>}
              </label>
              <label>Телефон
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  placeholder="+380XXXXXXXXX"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "err-phone" : undefined}
                />
                {errors.phone && <small id="err-phone" className={styles.error}>{errors.phone}</small>}
              </label>
              <small className={styles.note}>Email і телефон використовуються лише для доставки електронної версії.</small>
            </>
          ) : (
            <p>Паперова версія. Натисніть кнопку нижче, щоб перейти до оплати.</p>
          )}
        </div>

        {/* Footer buttons matching original design */}
        {isPaper ? (
          <div className={styles.checkoutFooter}>
            <button className={styles.imageBtn} onClick={onPurchase} aria-label="Monobank Checkout" disabled={loading}>
              <Image src={addBasePath("/images/monocheckout_button_black_normal.svg")} alt="" width={398} height={56} />
            </button>
          </div>
        ) : (
          <div className={styles.digitalCta}>
            <button className={styles.imageBtn} onClick={onPurchase} aria-label="Оплатити" disabled={loading || !digitalValid}>
              <Image src={addBasePath("/images/plata_dark_bg.svg")} alt="" width={150} height={40} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}