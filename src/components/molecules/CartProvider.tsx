"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useRef, useMemo, useCallback } from "react";
import { Product, ProductSchema } from "@/models/Product";
import { useProducts } from "./ProductsProvider";
import { PromoCodeResponse } from "@/models/PromoCode";
import { calculateCartDiscount, calculateItemDiscount, getDiscountedUnitsPerItem } from "@/lib/promocode.helper";
import { getInvoiceStatus, validatePromocode } from "@/lib/api";
import { canPurchase, getPrice } from "@/lib/product-item.helper";
import { getPaymentOutcome, matchesPaymentSelection, parsePaymentAttempts, selectionKey, PAYMENT_STORAGE_KEY, type PaymentAttempt, type PaymentSelection } from "@/lib/payment";
import type { ApiError } from "@/models/ApiError";

export interface CartItem {
  product: Product;
  itemId: string;
  quantity: number;
  format: "paper" | "digital";
  selectionId?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, itemId: string, format: "paper" | "digital", quantity?: number) => boolean;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  isInCart: (itemId: string) => boolean;
  openCart: (itemId?: string) => void;
  registerOpenCallback: (callback: (itemId?: string) => void) => void;
  appliedPromocode: PromoCodeResponse | null;
  discountAmount: number;
  getItemDiscount: (itemId: string) => number;
  applyPromocode: (code: string) => Promise<void>;
  removePromocode: () => void;
  hydrated: boolean;
  paymentAttempts: PaymentAttempt[];
  recordPayment: (attempt: PaymentAttempt) => void;
  finalizePayment: (reference: string) => void;
  reviewPayment: (reference: string) => Promise<{ ready: boolean; feedback?: string }>;
  findPayment: (items: readonly CartItem[], promoCode?: string) => PaymentAttempt | undefined;
  snapshotSelection: () => PaymentSelection[];
  prepareRetry: () => Promise<{ ready: boolean; feedback?: string }>;
  isCurrentSelection: (selection: readonly PaymentSelection[], promoCode?: string) => boolean;
  recoveryFeedback: string | null;
  setRecoveryFeedback: (feedback: string | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function readCart(value: string | null): CartItem[] {
  if (!value) return [];
  try {
    const stored: unknown = JSON.parse(value);
    if (!Array.isArray(stored)) return [];
    return stored.flatMap(item => {
      const product = ProductSchema.safeParse(item?.product);
      if (!product.success || typeof item?.itemId !== "string" || !Number.isSafeInteger(item.quantity) || item.quantity < 1 ||
          (item.format !== "paper" && item.format !== "digital")) return [];
      return [{ product: product.data, itemId: item.itemId, quantity: item.format === "digital" ? 1 : item.quantity,
        format: item.format, selectionId: typeof item.selectionId === "string" ? item.selectionId : crypto.randomUUID() }];
    });
  } catch { return []; }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { products, refreshForCheckout } = useProducts();
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedPromocode, setAppliedPromocode] = useState<PromoCodeResponse | null>(null);
  const [paymentAttempts, setPaymentAttempts] = useState<PaymentAttempt[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [recoveryFeedback, setRecoveryFeedback] = useState<string | null>(null);
  const itemsRef = useRef<CartItem[]>([]);
  const promoRef = useRef<PromoCodeResponse | null>(null);
  const attemptsRef = useRef<PaymentAttempt[]>([]);
  const readyRef = useRef(false);
  const cartOpenCallbackRef = useRef<((itemId?: string) => void) | null>(null);

  const saveItems = useCallback((next: CartItem[]) => {
    itemsRef.current = next;
    setItems(next);
    try { localStorage.setItem("cart", JSON.stringify(next)); } catch { /* Keep the in-memory cart usable. */ }
  }, []);
  const savePromo = useCallback((next: PromoCodeResponse | null) => {
    promoRef.current = next;
    setAppliedPromocode(next);
    try {
      if (next) localStorage.setItem("appliedPromocode", JSON.stringify(next));
      else localStorage.removeItem("appliedPromocode");
    } catch { /* Storage may be disabled. */ }
  }, []);
  const saveAttempts = useCallback((next: PaymentAttempt[]) => {
    attemptsRef.current = next;
    setPaymentAttempts(next);
    try {
      if (next.length) sessionStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(next));
      else sessionStorage.removeItem(PAYMENT_STORAGE_KEY);
    } catch { /* The receipt can still verify its URL reference without a snapshot. */ }
  }, []);

  useEffect(() => {
    let restored: CartItem[] = [];
    try { restored = readCart(localStorage.getItem("cart")); } catch { /* Keep empty cart. */ }
    saveItems(restored);
    try {
      const stored = localStorage.getItem("appliedPromocode");
      if (stored) savePromo(JSON.parse(stored));
    } catch { savePromo(null); }
    try { saveAttempts(parsePaymentAttempts(sessionStorage.getItem(PAYMENT_STORAGE_KEY))); } catch { saveAttempts([]); }
    readyRef.current = true;
    setHydrated(true);
    // Cross-tab edits retain their newer selection identities.
    const syncCart = (event: StorageEvent) => {
      if (event.key === "cart") {
        const next = readCart(event.newValue);
        itemsRef.current = next;
        setItems(next);
      }
      if (event.key === "appliedPromocode") {
        try {
          const next = event.newValue ? JSON.parse(event.newValue) : null;
          promoRef.current = next;
          setAppliedPromocode(next);
        } catch { /* Ignore malformed cross-tab data. */ }
      }
    };
    window.addEventListener("storage", syncCart);
    return () => window.removeEventListener("storage", syncCart);
  }, [saveItems, savePromo, saveAttempts]);

  useEffect(() => {
    if (!readyRef.current || !products.length) return;
    const current = itemsRef.current;
    const next = current.map(item => {
      const latest = products.find(product => product.id === item.product.id);
      return latest ? { ...item, product: latest } : item;
    });
    if (JSON.stringify(next) !== JSON.stringify(current)) saveItems(next);
  }, [products, saveItems]);

  const discountAmount = useMemo(() => calculateCartDiscount(items, appliedPromocode), [items, appliedPromocode]);
  const discountedUnitsPerItem = useMemo(() => getDiscountedUnitsPerItem(items, appliedPromocode), [items, appliedPromocode]);
  const getItemDiscount = (itemId: string): number => {
    const item = items.find(candidate => candidate.itemId === itemId);
    return item ? calculateItemDiscount(item, appliedPromocode, discountedUnitsPerItem.get(itemId) ?? 0) : 0;
  };
  const addItem = (product: Product, itemId: string, format: "paper" | "digital", quantity = 1): boolean => {
    const current = itemsRef.current;
    const existing = current.find(item => item.itemId === itemId);
    if (existing && format === "digital") return false;
    const selectionId = crypto.randomUUID();
    saveItems(existing ? current.map(item => item.itemId === itemId ? { ...item, quantity: item.quantity + quantity, selectionId } : item)
      : [...current, { product, itemId, quantity: format === "digital" ? 1 : quantity, format, selectionId }]);
    return true;
  };
  const removeItem = (itemId: string) => saveItems(itemsRef.current.filter(item => item.itemId !== itemId));
  const updateQuantity = (itemId: string, quantity: number) => {
    if (!Number.isSafeInteger(quantity) || quantity < 1) return;
    saveItems(itemsRef.current.map(item => item.itemId === itemId && item.format !== "digital" && item.quantity !== quantity
      ? { ...item, quantity, selectionId: crypto.randomUUID() } : item));
  };
  const clearCart = () => { saveItems([]); savePromo(null); };
  const applyPromocode = async (code: string) => {
    const selected = itemsRef.current;
    const promo = await validatePromocode(code, selected.map(item => item.itemId));
    if (selectionKey(selected) === selectionKey(itemsRef.current)) savePromo(promo);
  };
  const removePromocode = () => savePromo(null);

  const recordPayment = useCallback((attempt: PaymentAttempt) => {
    if (!readyRef.current) return;
    const parsed = parsePaymentAttempts(JSON.stringify([attempt]));
    if (parsed.length) saveAttempts([...attemptsRef.current.filter(candidate => candidate.reference !== attempt.reference), parsed[0]]);
    setRecoveryFeedback(null);
  }, [saveAttempts]);
  const finalizePayment = useCallback((reference: string) => {
    if (!readyRef.current) return;
    const attempt = attemptsRef.current.find(candidate => candidate.reference === reference);
    if (!attempt) return;
    // Persist the safe transition before consuming the snapshot. Replays are harmless.
    const next = itemsRef.current.filter(item => !attempt.items.some(purchased =>
      purchased.itemId === item.itemId && purchased.selectionId === item.selectionId && purchased.quantity === item.quantity));
    saveItems(next);
    if (!next.length) savePromo(null);
    saveAttempts(attemptsRef.current.filter(candidate => candidate.reference !== reference));
  }, [saveItems, savePromo, saveAttempts]);

  const reviewPayment = useCallback(async (reference: string): Promise<{ ready: boolean; feedback?: string }> => {
    const attempt = attemptsRef.current.find(candidate => candidate.reference === reference);
    if (!attempt) return { ready: false, feedback: "Дані для відновлення доступні лише у вкладці, де було створено замовлення. Перегляньте поточний кошик." };
    const status = await getInvoiceStatus(reference);
    const outcome = getPaymentOutcome(status.status);
    if (outcome === "success" || outcome === "authorized") { finalizePayment(reference); return { ready: false, feedback: "Оплату вже підтверджено. Оновіть статус замовлення." }; }
    const current = itemsRef.current;
    const currentPromo = promoRef.current;
    const latestProducts = await refreshForCheckout();
    if (!attemptsRef.current.includes(attempt)) return { ready: false, feedback: "Стан оплати змінився. Перевірте статус замовлення." };
    if (selectionKey(itemsRef.current) !== selectionKey(current) || promoRef.current !== currentPromo) return { ready: false, feedback: "Кошик змінився під час перевірки. Перегляньте його ще раз." };
    const requested = [...current, ...attempt.items.filter(purchased => !current.some(item => item.itemId === purchased.itemId))];
    const resolved = requested.map(selected => {
      const product = latestProducts.find(candidate => candidate.isActive !== false && candidate.items.some(item => item.id === selected.itemId));
      return { selected, product, productItem: product?.items.find(item => item.id === selected.itemId) };
    });
    if (resolved.some(item => !item.product || !canPurchase(item.productItem))) return { ready: false, feedback: "Деякі товари більше недоступні. Змініть або видаліть їх у кошику перед повторною оплатою." };
    const next: CartItem[] = resolved.map(({ selected, product }) => ({ product: product!, itemId: selected.itemId,
      quantity: selected.quantity, format: selected.format,
      selectionId: selected.selectionId }));
    // A newer basket/promo is authoritative; restore the old promo only with its basket.
    const promoCode = current.length ? currentPromo?.code : attempt.promoCode;
    let promo: PromoCodeResponse | null = null;
    let feedback: string | null = null;
    if (promoCode) {
      try { promo = await validatePromocode(promoCode, next.map(item => item.itemId)); }
      catch (error) {
        const status = (error as ApiError).status;
        if (status !== 400 && status !== 404 && status !== 422) throw error;
        feedback = "Промокод більше не діє. Кошик оновлено без знижки — перевірте нову суму перед оплатою.";
      }
    }
    if (selectionKey(itemsRef.current) !== selectionKey(current) || promoRef.current !== currentPromo) return { ready: false, feedback: "Кошик змінився під час перевірки. Перегляньте його ще раз." };
    if (!attemptsRef.current.includes(attempt)) return { ready: false, feedback: "Стан оплати змінився. Перевірте статус замовлення." };
    saveItems(next);
    savePromo(promo);
    return { ready: true, feedback: feedback ?? undefined };
  }, [refreshForCheckout, finalizePayment, saveItems, savePromo]);

  const prepareRetry = async (): Promise<{ ready: boolean; feedback?: string }> => {
    const current = itemsRef.current;
    const currentPromo = promoRef.current;
    const activeAttempts = attemptsRef.current;
    const latest = await refreshForCheckout();
    const next = current.map(selected => {
      const product = latest.find(candidate => candidate.isActive !== false && candidate.items.some(item => item.id === selected.itemId));
      return product ? { ...selected, product } : null;
    });
    if (next.some(item => !item || !canPurchase(item.product.items.find(candidate => candidate.id === item.itemId)))) {
      return { ready: false, feedback: "Деякі товари більше недоступні. Перевірте склад кошика перед оплатою." };
    }
    let promo: PromoCodeResponse | null = null;
    let invalidPromo = false;
    if (currentPromo?.code) {
      try { promo = await validatePromocode(currentPromo.code, current.map(item => item.itemId)); }
      catch (error) {
        const status = (error as ApiError).status;
        if (status !== 400 && status !== 404 && status !== 422) throw error;
        invalidPromo = true;
      }
    }
    if (selectionKey(itemsRef.current) !== selectionKey(current) || promoRef.current !== currentPromo || activeAttempts !== attemptsRef.current) {
      return { ready: false, feedback: "Кошик або стан оплати змінився. Перегляньте його ще раз." };
    }
    const resolved = next as CartItem[];
    const priceChanged = current.some((item, index) => getPrice(item.product.items.find(candidate => candidate.id === item.itemId)!) !==
      getPrice(resolved[index].product.items.find(candidate => candidate.id === item.itemId)!));
    const discountChanged = calculateCartDiscount(current, currentPromo) !== calculateCartDiscount(resolved, promo);
    saveItems(resolved);
    savePromo(promo);
    return invalidPromo || priceChanged || discountChanged
      ? { ready: false, feedback: invalidPromo ? "Промокод більше не діє. Перевірте оновлену суму без знижки." : "Ціни або знижка змінилися. Перевірте оновлену суму перед оплатою." }
      : { ready: true };
  };

  const findPayment = (selected: readonly CartItem[], promoCode?: string) => attemptsRef.current.findLast(attempt => matchesPaymentSelection(attempt, selected, promoCode));
  const snapshotSelection = () => itemsRef.current.map(item => ({ itemId: item.itemId, quantity: item.quantity, format: item.format, selectionId: item.selectionId! }));
  const isCurrentSelection = (selection: readonly PaymentSelection[], promoCode?: string) =>
    selectionKey(selection) === selectionKey(itemsRef.current) && (promoRef.current?.code ?? "") === (promoCode ?? "");
  const isInCart = (itemId: string) => items.some(item => item.itemId === itemId);
  const openCart = useCallback((itemId?: string) => cartOpenCallbackRef.current?.(itemId), []);
  const registerOpenCallback = (callback: (itemId?: string) => void) => { cartOpenCallbackRef.current = callback; };
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, isInCart, openCart,
    registerOpenCallback, appliedPromocode, discountAmount, getItemDiscount, applyPromocode, removePromocode, hydrated,
    paymentAttempts, recordPayment, finalizePayment, reviewPayment, findPayment, snapshotSelection, prepareRetry, isCurrentSelection,
    recoveryFeedback, setRecoveryFeedback }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
