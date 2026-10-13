"use client";
import React, { useState, useRef, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import styles from "./CheckoutForm.module.css";
import { CartItem, useCart } from "@/components/molecules/CartProvider";
import NovaPoshtaWidget, { NovaPoshtaDepartment } from "@/components/organisms/NovaPoshtaWidget";
import { getPrice } from "@/lib/product-item.helper";
import { useDialogA11y } from "@/lib/dialog-a11y";
import { formatMoney, multiplyMoney, subtractMoney, sumMoney } from "@/lib/money";
import { checkoutFieldLabels, getCheckoutFailure, type CheckoutFailure, type CheckoutField } from "@/lib/checkout-errors";

const MAX_ORDER_NOTE_LENGTH = 500;

interface CheckoutFormProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onSubmit: (data: CheckoutFormData) => Promise<void>;
  onEditCart: (itemId?: string) => void;
}

export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: NovaPoshtaDepartment;
  orderNote?: string;
}

export default function CheckoutForm({ open, onClose, items, onSubmit, onEditCart }: CheckoutFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState<NovaPoshtaDepartment | undefined>(undefined);
  const [orderNote, setOrderNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [failure, setFailure] = useState<CheckoutFailure | null>(null);
  const rejectedValuesRef = useRef<Partial<Record<CheckoutField, string>>>({});
  const [feedbackVersion, setFeedbackVersion] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const { appliedPromocode, discountAmount, getItemDiscount } = useCart();

  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const departmentLabelId = useId();
  const orderNoteId = useId();
  const orderNoteDescriptionId = useId();
  const feedbackRef = useRef<HTMLDivElement>(null);
  const feedbackTitleId = useId();
  const fieldId = (field: CheckoutField) => field === "orderNote" ? orderNoteId : `${titleId}-${field}`;
  const itemId = (id: string) => `${titleId}-item-${id}`;

  useEffect(() => {
    if (!feedbackVersion) return;
    const target = feedbackRef.current ?? dialogRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-checkout-department-error="true"] button');
    target?.focus();
    target?.scrollIntoView({ block: "nearest" });
  }, [feedbackVersion]);

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

  // Keep the in-memory draft while this mounted storefront is loaded.
  // Reopening only resets validation feedback; submission always validates again.
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setTouched({});
    setFailure(null);
    rejectedValuesRef.current = {};
  }, [open]);

  // Validation
  const validationErrors = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = "Введіть ім'я";
    else if (firstName.trim().length > 100) newErrors.firstName = "Ім’я має містити до 100 символів";
    if (!lastName.trim()) newErrors.lastName = "Введіть прізвище";
    else if (lastName.trim().length > 100) newErrors.lastName = "Прізвище має містити до 100 символів";
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) newErrors.email = "Введіть дійсний email";
    else if (email.trim().length > 320) newErrors.email = "Email має містити до 320 символів";
    if (orderNote.trim().length > MAX_ORDER_NOTE_LENGTH) newErrors.orderNote = "Коментар має містити до 500 символів";

    if (hasPhysical) {
      if (!phone.trim() || !/^\+?\d{10,14}$/.test(phone)) {
        newErrors.phone = "Введіть дійсний телефон (10–14 цифр)";
      }
      if (!department) newErrors.department = "Оберіть відділення Нової Пошти";
    }

    return newErrors;
  };

  const correctField = (field: CheckoutField, value: string, localError = validationErrors()[field]) => {
    setTouched(previous => ({ ...previous, [field]: true }));
    if (!errors[field]) return;
    // A locally valid but unchanged value must not dismiss a server rejection.
    if (!localError && rejectedValuesRef.current[field] === value) return;
    setErrors(previous => {
      const next = { ...previous };
      if (localError) next[field] = localError;
      else delete next[field];
      return next;
    });
    if (!localError) {
      delete rejectedValuesRef.current[field];
      setFailure(previous => {
        if (!previous) return previous;
        const fields = { ...previous.fields };
        delete fields[field];
        return Object.keys(fields).length || Object.keys(previous.items).length || previous.cart || previous.promo || previous.unknown
          ? { ...previous, fields } : null;
      });
    }
  };

  const focusLocation = (id: string) => {
    const target = document.getElementById(id);
    (target?.getAttribute("role") === "group" ? target : target?.querySelector<HTMLElement>("button") ?? target)?.focus();
    target?.scrollIntoView({ block: "nearest" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;

    // Mark all as touched
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      department: true,
      orderNote: true,
    });

    const newErrors = validationErrors();
    setErrors(newErrors);
    setFailure(null);
    rejectedValuesRef.current = {};
    if (Object.keys(newErrors).length === 0) {
      const submittedItems = [...items];
      const submittedValues = { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim(), department: JSON.stringify(department), orderNote: orderNote.trim() };
      submittingRef.current = true;
      setIsSubmitting(true);
      try {
        await onSubmit({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: hasPhysical ? phone.trim() : undefined,
          department: hasPhysical ? department : undefined,
          orderNote: orderNote.trim() || undefined,
        });
      } catch (error) {
        const nextFailure = getCheckoutFailure(error, submittedItems);
        rejectedValuesRef.current = submittedValues;
        setErrors(nextFailure.fields);
        setFailure(nextFailure);
        setFeedbackVersion(version => version + 1);
      } finally {
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    } else {
      setFeedbackVersion(version => version + 1);
    }
  };

  if (!open || !mounted) return null;

  const subtotal = sumMoney(items.map((item) => {
    const productItem = item.product.items.find((i) => i.id === item.itemId);
    const price = productItem ? getPrice(productItem) ?? 0 : 0;
    return multiplyMoney(price, item.quantity);
  }));

  const total = subtractMoney(subtotal, discountAmount);
  const hasMissingRejectedItem = failure && Object.keys(failure.items).some(id => !items.some(item => item.itemId === id));
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
            {failure && (
              <div ref={feedbackRef} role="alert" tabIndex={-1} aria-labelledby={feedbackTitleId} className={styles.rejection}>
                <h3 id={feedbackTitleId}>{failure.kind === "temporary" ? "Не вдалося оформити замовлення" : "Замовлення не прийнято"}</h3>
                <p>{failure.kind === "temporary"
                  ? "З’єднання або сервіс тимчасово недоступні. Ваші дані та кошик збережено. Спробуйте ще раз."
                  : "Перевірте дані та кошик, потім підтвердьте замовлення ще раз."}</p>
                {failure.unknown && <p>Не вдалося визначити, що потрібно виправити. Перевірте кошик і введені дані. Якщо помилка повторюється, зверніться до нас через контакти внизу сторінки.</p>}
                <ul>
                  {(Object.keys(failure.fields) as CheckoutField[]).map(field => (
                    <li key={field}><a href={`#${fieldId(field)}`} onClick={event => { event.preventDefault(); focusLocation(fieldId(field)); }}>{checkoutFieldLabels[field]}</a></li>
                  ))}
                  {items.filter(item => failure.items[item.itemId]).map(item => (
                    <li key={item.itemId}><a href={`#${itemId(item.itemId)}`} onClick={event => { event.preventDefault(); focusLocation(itemId(item.itemId)); }}>{item.product.name} — {item.format === "paper" ? "Паперова" : "Електронна"}</a></li>
                  ))}
                </ul>
                {(failure.cart || failure.promo || hasMissingRejectedItem) && <p>{failure.cart || failure.promo || "Склад кошика змінився. Перевірте товари перед повторним підтвердженням."}</p>}
                {failure.kind === "temporary" ? (
                  <button type="submit" className={styles.correctionButton} disabled={isSubmitting}>Спробувати ще раз</button>
                ) : (failure.unknown || failure.cart || failure.promo || hasMissingRejectedItem) && (
                  <button type="button" className={styles.correctionButton} onClick={() => onEditCart()}>Перевірити кошик</button>
                )}
              </div>
            )}
            <label className={styles.field}>
              <span className={styles.label}>Ім&#39;я *</span>
              <input
                type="text"
                id={fieldId("firstName")}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onBlur={() => correctField("firstName", firstName.trim())}
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
                id={fieldId("lastName")}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onBlur={() => correctField("lastName", lastName.trim())}
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
                id={fieldId("email")}
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => correctField("email", email.trim())}
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
                    id={fieldId("phone")}
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => correctField("phone", phone.trim())}
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
                <div id={fieldId("department")} data-checkout-department-error={touched.department && !!errors.department} className={styles.field}>
                  <span id={departmentLabelId} className={styles.label}>Відділення Нової Пошти *</span>
                  <NovaPoshtaWidget
                    value={department}
                    onSelect={(dept) => {
                      setDepartment(dept);
                      correctField("department", JSON.stringify(dept), "");
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

            <div className={styles.field}>
              <label htmlFor={orderNoteId} className={styles.label}>Коментар до замовлення (необов’язково)</label>
              <textarea
                id={orderNoteId}
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                onBlur={() => correctField("orderNote", orderNote.trim())}
                maxLength={MAX_ORDER_NOTE_LENGTH}
                rows={4}
                aria-invalid={touched.orderNote && !!errors.orderNote}
                aria-describedby={`${orderNoteDescriptionId}${touched.orderNote && errors.orderNote ? " err-orderNote" : ""}`}
                className={styles.textarea}
              />
              {touched.orderNote && errors.orderNote && <small id="err-orderNote" role="alert" className={styles.error}>{errors.orderNote}</small>}
              <span id={orderNoteDescriptionId} className={styles.fieldMeta}>
                <small className={styles.helper}>
                  Наприклад, побажання щодо доставки.
                </small>
                <small className={styles.counter} aria-live="polite">
                  {orderNote.length}/{MAX_ORDER_NOTE_LENGTH}
                </small>
              </span>
            </div>

            <div className={styles.summary}>
              <h3 className={styles.summaryTitle}>Ваше замовлення</h3>
              <div className={styles.itemList}>
                {items.map((item) => {
                  const productItem = item.product.items.find((i) => i.id === item.itemId);
                  const price = productItem ? getPrice(productItem) ?? 0 : 0;
                  const itemDiscount = getItemDiscount(item.itemId);
                  const itemTotal = multiplyMoney(price, item.quantity);
                  
                  return (
                    <div key={item.itemId} id={itemId(item.itemId)} role="group" tabIndex={-1} aria-label={`${item.product.name} — ${item.format === "paper" ? "Паперова" : "Електронна"}`} aria-describedby={failure?.items[item.itemId] ? `${itemId(item.itemId)}-error` : undefined} className={styles.summaryItem}>
                      <span className={styles.summaryItemName}>{productItem?.name || item.product.name}</span>
                      <span className={styles.summaryItemQty}>x{item.quantity}</span>
                      <div className={styles.summaryItemPrice}>
                        {itemDiscount > 0 && (
                          <span className={styles.summaryItemOldPrice}>{formatMoney(itemTotal)} грн</span>
                        )}
                        <span>{formatMoney(subtractMoney(itemTotal, itemDiscount))} грн</span>
                      </div>
                      {failure?.items[item.itemId] && (
                        <div className={styles.itemRejection}>
                          <small id={`${itemId(item.itemId)}-error`} role="alert" className={styles.error}>{failure.items[item.itemId]}</small>
                          <button type="button" className={styles.correctionButton} onClick={() => onEditCart(item.itemId)}>Змінити або видалити товар у кошику</button>
                        </div>
                      )}
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
