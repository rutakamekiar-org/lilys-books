"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useRef, useMemo, useCallback } from "react";
import { Product, ProductSchema } from "@/models/Product";
import { useProducts } from "./ProductsProvider";
import { PromoCodeResponse } from "@/models/PromoCode";
import { calculateCartDiscount, calculateItemDiscount, getDiscountedUnitsPerItem } from "@/lib/promocode.helper";
import { validatePromocode } from "@/lib/api";
import { canPurchase, getPrice } from "@/lib/product-item.helper";
import { parsePaymentSelections, selectionKey, PAYMENT_STORAGE_KEY, type PaymentSelectionSnapshot, type PaymentSelection } from "@/lib/payment";
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
  recordPayment: (attempt: PaymentSelectionSnapshot) => void;
  finalizePayment: (reference: string) => void;
  snapshotSelection: () => PaymentSelection[];
  prepareCheckout: () => Promise<{ ready: boolean; feedback?: string }>;
  isCurrentSelection: (selection: readonly PaymentSelection[], promoCode?: string) => boolean;
  checkoutFeedback: string | null;
  setCheckoutFeedback: (feedback: string | null) => void;
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
  const [hydrated, setHydrated] = useState(false);
  const [checkoutFeedback, setCheckoutFeedback] = useState<string | null>(null);
  const itemsRef = useRef<CartItem[]>([]);
  const promoRef = useRef<PromoCodeResponse | null>(null);
  const selectionsRef = useRef<PaymentSelectionSnapshot[]>([]);
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
  const saveSelections = useCallback((next: PaymentSelectionSnapshot[]) => {
    selectionsRef.current = next;
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
    try {
      sessionStorage.removeItem("paymentAttempts");
      saveSelections(parsePaymentSelections(sessionStorage.getItem(PAYMENT_STORAGE_KEY)));
    } catch { saveSelections([]); }
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
  }, [saveItems, savePromo, saveSelections]);

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

  const recordPayment = useCallback((attempt: PaymentSelectionSnapshot) => {
    if (!readyRef.current) return;
    const parsed = parsePaymentSelections(JSON.stringify([attempt]));
    if (parsed.length) saveSelections([...selectionsRef.current.filter(candidate => candidate.reference !== attempt.reference), parsed[0]]);
    setCheckoutFeedback(null);
  }, [saveSelections]);
  const finalizePayment = useCallback((reference: string) => {
    if (!readyRef.current) return;
    const attempt = selectionsRef.current.find(candidate => candidate.reference === reference);
    if (!attempt) return;
    // Persist the safe transition before consuming the snapshot. Replays are harmless.
    const next = itemsRef.current.filter(item => !attempt.items.some(purchased =>
      purchased.itemId === item.itemId && purchased.selectionId === item.selectionId && purchased.quantity === item.quantity));
    saveItems(next);
    if (!next.length) savePromo(null);
    saveSelections(selectionsRef.current.filter(candidate => candidate.reference !== reference));
  }, [saveItems, savePromo, saveSelections]);

  const prepareCheckout = async (): Promise<{ ready: boolean; feedback?: string }> => {
    const current = itemsRef.current;
    const currentPromo = promoRef.current;
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
    if (selectionKey(itemsRef.current) !== selectionKey(current) || promoRef.current !== currentPromo) {
      return { ready: false, feedback: "Кошик змінився. Перегляньте його ще раз." };
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

  const snapshotSelection = () => itemsRef.current.map(item => ({ itemId: item.itemId, quantity: item.quantity, format: item.format, selectionId: item.selectionId! }));
  const isCurrentSelection = (selection: readonly PaymentSelection[], promoCode?: string) =>
    selectionKey(selection) === selectionKey(itemsRef.current) && (promoRef.current?.code ?? "") === (promoCode ?? "");
  const isInCart = (itemId: string) => items.some(item => item.itemId === itemId);
  const openCart = useCallback((itemId?: string) => cartOpenCallbackRef.current?.(itemId), []);
  const registerOpenCallback = (callback: (itemId?: string) => void) => { cartOpenCallbackRef.current = callback; };
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, isInCart, openCart,
    registerOpenCallback, appliedPromocode, discountAmount, getItemDiscount, applyPromocode, removePromocode, hydrated,
    recordPayment, finalizePayment, snapshotSelection, prepareCheckout, isCurrentSelection,
    checkoutFeedback, setCheckoutFeedback }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
