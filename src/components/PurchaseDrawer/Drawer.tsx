"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import {createDigitalInvoice, createPaperCheckout} from "@/lib/api";
import type { Book, BookFormat } from "@/lib/types";
import styles from "./Drawer.module.css";
import { addBasePath } from "@/lib/paths";

export default function Drawer({
  open, onCloseAction, book, format,
}: { open: boolean; onCloseAction: () => void; book: Book; format: BookFormat; }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});
  const [touched, setTouched] = useState<{ email: boolean; phone: boolean }>({ email: false, phone: false });
  const [quantity, setQuantity] = useState<number | ''>(1);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastActiveEl = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape" && open) onCloseAction(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCloseAction]);

  useEffect(() => {
    if (open) {
      lastActiveEl.current = document.activeElement as HTMLElement;
      setErrors({});
      setTouched({ email: false, phone: false });
      setLoading(false);
      setEmail("");
      setPhone("");
      setQuantity(1);
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
  const quantityValid = useMemo(() => quantity && Number.isFinite(quantity) && quantity >= 1, [quantity]);

  // Live validation feedback for digital inputs once fields are touched
  useEffect(() => {
    if (format !== "digital") return;
    const next: { email?: string; phone?: string } = {};
    if (touched.email && !validEmail) next.email = "Введіть дійсний email";
    if (touched.phone && !validPhone) next.phone = "Введіть дійсний телефон (10–14 цифр, можна з +)";
    setErrors(next);
  }, [email, phone, validEmail, validPhone, touched, format]);

  const selected = useMemo(() => book.formats.find(f => f.type === format)!, [book, format]);

  const isPaper = format === "paper";
  const displayPrice = useMemo(() => {
    const base = selected?.price ?? 0;
    if (isPaper) {
      const qty = Math.max(1, Math.floor(Number(quantity) || 1));
      return base * qty;
    }
    return base;
  }, [selected?.price, isPaper, quantity]);

  if (!open) return null;

  const onPurchase = async () => {
    try {
      setErrors({});
      setLoading(true);
      if (format === "paper") {
        const qty = Math.max(1, Math.floor(Number(quantity) || 1));
        const res = await createPaperCheckout(book.id, qty);
        onCloseAction()
        window.location.href = res.redirectUrl;
        return;
      }
      const newErrors: { email?: string; phone?: string } = {};
      if (!validEmail) newErrors.email = "Введіть дійсний email";
      if (!validPhone) newErrors.phone = "Введіть дійсний телефон (10–14 цифр, можна з +)";
      if (newErrors.email || newErrors.phone) {
        setTouched({ email: true, phone: true });
        setErrors(newErrors);
        setLoading(false);
        return;
      }
      const res = await createDigitalInvoice({ productId: selected.productId, customerEmail: email.trim(), customerPhone: phone.trim() });
      onCloseAction()
      window.location.href = res.redirectUrl;
    } catch (err: unknown) {
      setLoading(false);
      type ErrorDetails = { errors?: Record<string, string[]> };
      const message = err instanceof Error ? err.message : undefined;
      const details: ErrorDetails | undefined =
        typeof err === "object" && err !== null && "details" in err
          ? (err as { details?: ErrorDetails }).details
          : undefined;
      const errs = details?.errors;
      if (errs) {
        if (errs.CustomerEmail?.[0]) {
          alert("Будь ласка, введіть дійсну адресу електронної пошти.");
        } else if (errs.CustomerPhone?.[0]) {
          alert("Будь ласка, введіть дійсний номер телефону.");
        } else {
          const firstKey = Object.keys(errs)[0];
          alert((firstKey ? errs[firstKey]?.[0] : undefined) || message || "Виникла помилка.");
        }
      } else {
        alert(message || "Сервер зараз недоступний. Спробуйте пізніше.");
      }
    }
  };

  return (
    <div className={styles.overlay} aria-modal="true" role="dialog" aria-label="Оформлення замовлення" onClick={(e) => { if (e.target === e.currentTarget) onCloseAction(); }}>
      <div className={styles.sheet} ref={dialogRef} aria-busy={loading || undefined}>
        {loading && (
          <div className={styles.topProgress} aria-hidden="true">
            <div className={styles.topProgressInner} />
          </div>
        )}
        <header className={styles.header}>
          <h3 className={styles.headerTitle}>
            <span className={styles.titleMain}>{book.title} — {isPaper ? "Паперова" : "Електронна"}</span>
            {selected?.price != null && (
              <span className={styles.price}>{`${displayPrice} грн`}</span>
            )}
          </h3>
          <button onClick={onCloseAction} aria-label="Закрити" className={styles.close}>×</button>
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
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
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
                  onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
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
            <>
              <label>Кількість
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(e) => {
                    const v = Math.floor(Number(e.target.value));
                    if (Number.isFinite(v) && v >= 1)
                        setQuantity(Number(e.target.value));
                    else setQuantity('');
                  }}
                  onBlur={() => {
                    setQuantity((q) => q && (Number.isFinite(q) && q >= 1 ? Math.floor(Number(q)) : 1));
                  }}
                  aria-label="Кількість примірників"
                  aria-invalid={!quantityValid}
                  aria-describedby={!quantityValid ? "err-qty" : undefined}
                />
                {!quantityValid && (
                  <small id="err-qty" className={styles.error}>Вкажіть коректну кількість (мінімум 1).</small>
                )}
              </label>
              <small className={styles.note}>Вкажіть кількість паперових примірників.</small>
              <small className={styles.note}>Натисніть кнопку нижче, щоб перейти до оплати.</small>
            </>
          )}
        </div>

        {/* Footer buttons matching original design */}
        {isPaper ? (
          <div className={styles.digitalCta}>
            <button className={styles.imageBtn} onClick={onPurchase} aria-label="Monobank Checkout" disabled={loading || !quantityValid}>
              <Image src={addBasePath("/images/monocheckout_button_black_normal.svg")} alt="" width={398} height={40} />
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