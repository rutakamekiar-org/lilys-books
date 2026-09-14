"use client";
import React, { useState, useRef, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import styles from "./CheckoutForm.module.css";
import { CartItem, useCart } from "@/components/molecules/CartProvider";
import NovaPoshtaWidget, { NovaPoshtaDepartment } from "@/components/organisms/NovaPoshtaWidget";
import { getPrice } from "@/lib/product-item.helper";
import { useDialogA11y } from "@/lib/dialog-a11y";
import { formatMoney, multiplyMoney, subtractMoney, sumMoney } from "@/lib/money";

interface CheckoutFormProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onSubmit: (data: CheckoutFormData) => Promise<void>;
}

export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: NovaPoshtaDepartment;
}

export default function CheckoutForm({ open, onClose, items, onSubmit }: CheckoutFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState<NovaPoshtaDepartment | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const { appliedPromocode, discountAmount, getItemDiscount } = useCart();

  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const departmentLabelId = useId();

  // The dialog only exists once mounted, so focus management waits for the portal.
  useDialogA11y({ open: open && mounted, onClose, dialogRef });

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

  const hasPhysical = items.some((item) => item.format === "paper");

  // Start every checkout from a clean form.
  useEffect(() => {
    if (!open) return;
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setDepartment(undefined);
    setErrors({});
    setTouched({});
  }, [open]);

  // Validation
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = "Введіть ім'я";
    if (!lastName.trim()) newErrors.lastName = "Введіть прізвище";
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) newErrors.email = "Введіть дійсний email";

    if (hasPhysical) {
      if (!phone.trim() || !/^\+?\d{10,14}$/.test(phone)) {
        newErrors.phone = "Введіть дійсний телефон (10–14 цифр)";
      }
      if (!department) newErrors.department = "Оберіть відділення Нової Пошти";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all as touched
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      department: true,
    });

    if (validate()) {
      setIsSubmitting(true);
      try {
        await onSubmit({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: hasPhysical ? phone.trim() : undefined,
          department: hasPhysical ? department : undefined,
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!open || !mounted) return null;

  const subtotal = sumMoney(items.map((item) => {
    const productItem = item.product.items.find((i) => i.id === item.itemId);
    const price = productItem ? getPrice(productItem) ?? 0 : 0;
    return multiplyMoney(price, item.quantity);
  }));

  const total = subtractMoney(subtotal, discountAmount);
  const overlayStyle = viewportHeight
    ? ({ ["--checkout-viewport-height"]: `${viewportHeight}px` } as { [key: string]: string })
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
      <div className={styles.sheet} ref={dialogRef}>
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>Оформлення замовлення</h2>
          <button onClick={onClose} aria-label="Закрити" className={styles.close}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.content}>
            <label className={styles.field}>
              <span className={styles.label}>Ім&#39;я *</span>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
                autoComplete="given-name"
                aria-invalid={touched.firstName && !!errors.firstName}
                aria-describedby={touched.firstName && errors.firstName ? "err-firstName" : undefined}
                className={styles.input}
              />
              {touched.firstName && errors.firstName && (
                <small id="err-firstName" role="alert" className={styles.error}>{errors.firstName}</small>
              )}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Прізвище *</span>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
                autoComplete="family-name"
                aria-invalid={touched.lastName && !!errors.lastName}
                aria-describedby={touched.lastName && errors.lastName ? "err-lastName" : undefined}
                className={styles.input}
              />
              {touched.lastName && errors.lastName && (
                <small id="err-lastName" role="alert" className={styles.error}>{errors.lastName}</small>
              )}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Email *</span>
              <input
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                autoComplete="email"
                aria-invalid={touched.email && !!errors.email}
                aria-describedby={touched.email && errors.email ? "err-email" : undefined}
                className={styles.input}
              />
              {touched.email && errors.email && (
                <small id="err-email" role="alert" className={styles.error}>{errors.email}</small>
              )}
            </label>

            {hasPhysical && (
              <>
                <label className={styles.field}>
                  <span className={styles.label}>Телефон *</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                    autoComplete="tel"
                    placeholder="+380XXXXXXXXX"
                    aria-invalid={touched.phone && !!errors.phone}
                    aria-describedby={touched.phone && errors.phone ? "err-phone" : undefined}
                    className={styles.input}
                  />
                  {touched.phone && errors.phone && (
                    <small id="err-phone" role="alert" className={styles.error}>{errors.phone}</small>
                  )}
                </label>

                {/* A <label> cannot name a <button>, so this field is wired up with aria-labelledby. */}
                <div className={styles.field}>
                  <span id={departmentLabelId} className={styles.label}>Відділення Нової Пошти *</span>
                  <NovaPoshtaWidget
                    value={department}
                    onSelect={(dept) => {
                      setDepartment(dept);
                      setTouched((t) => ({ ...t, department: true }));
                    }}
                    labelledBy={departmentLabelId}
                    describedBy={touched.department && errors.department ? "err-department" : undefined}
                  />
                  {touched.department && errors.department && (
                    <small id="err-department" role="alert" className={styles.error}>{errors.department}</small>
                  )}
                </div>
              </>
            )}

            <small className={styles.note}>
              {hasPhysical
                ? "Доставка здійснюється Новою Поштою."
                : "Електронна версія буде надіслана на вказаний email"}
            </small>

            <div className={styles.summary}>
              <h3 className={styles.summaryTitle}>Ваше замовлення</h3>
              <div className={styles.itemList}>
                {items.map((item) => {
                  const productItem = item.product.items.find((i) => i.id === item.itemId);
                  const price = productItem ? getPrice(productItem) ?? 0 : 0;
                  const itemDiscount = getItemDiscount(item.itemId);
                  const itemTotal = multiplyMoney(price, item.quantity);
                  
                  return (
                    <div key={item.itemId} className={styles.summaryItem}>
                      <span className={styles.summaryItemName}>{productItem?.name || item.product.name}</span>
                      <span className={styles.summaryItemQty}>x{item.quantity}</span>
                      <div className={styles.summaryItemPrice}>
                        {itemDiscount > 0 && (
                          <span className={styles.summaryItemOldPrice}>{formatMoney(itemTotal)} грн</span>
                        )}
                        <span>{formatMoney(subtractMoney(itemTotal, itemDiscount))} грн</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={styles.summaryDivider} />
              <div className={styles.summaryRow}>
                <span>Сума:</span>
                <span>{formatMoney(subtotal)} грн</span>
              </div>
              {discountAmount > 0 && (
                <div className={styles.summaryRow}>
                  <span>Знижка {appliedPromocode?.code && `(${appliedPromocode.code.toUpperCase()})`}:</span>
                  <span className={styles.discountValue}>-{formatMoney(discountAmount)} грн</span>
                </div>
              )}
              <div className={styles.totalRow}>
                <span>Всього до сплати:</span>
                <span>{formatMoney(total)} грн</span>
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? "Обробка замовлення..." : "Підтвердити замовлення"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
