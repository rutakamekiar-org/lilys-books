"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useRef, useMemo } from "react";
import { Product } from "@/models/Product";
import { useProducts } from "./ProductsProvider";
import { PromoCodeResponse } from "@/models/PromoCode";
import { calculateCartDiscount, calculateItemDiscount, getDiscountedUnitsPerItem } from "@/lib/promocode.helper";
import { validatePromocode } from "@/lib/api";

export interface CartItem {
  product: Product;
  itemId: string;
  quantity: number;
  format: "paper" | "digital";
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, itemId: string, format: "paper" | "digital", quantity?: number) => boolean;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  isInCart: (itemId: string) => boolean;
  openCart: () => void;
  registerOpenCallback: (callback: () => void) => void;
  appliedPromocode: PromoCodeResponse | null;
  discountAmount: number;
  getItemDiscount: (itemId: string) => number;
  applyPromocode: (code: string) => Promise<void>;
  removePromocode: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { products } = useProducts();
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedPromocode, setAppliedPromocode] = useState<PromoCodeResponse | null>(null);
  const cartOpenCallbackRef = useRef<(() => void) | null>(null);

  const discountAmount = useMemo(() =>
    calculateCartDiscount(items, appliedPromocode),
    [items, appliedPromocode]
  );

  const discountedUnitsPerItem = useMemo(() =>
    getDiscountedUnitsPerItem(items, appliedPromocode),
    [items, appliedPromocode]
  );

  const getItemDiscount = (itemId: string): number => {
    const item = items.find(i => i.itemId === itemId);
    if (!item) return 0;
    return calculateItemDiscount(item, appliedPromocode, discountedUnitsPerItem.get(itemId));
  };

  // Sync items with latest product data from ProductsProvider
  useEffect(() => {
    if (products.length === 0) return;
    setItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        const latest = products.find((p) => p.id === item.product.id);
        if (latest && JSON.stringify(latest) !== JSON.stringify(item.product)) {
          changed = true;
          return { ...item, product: latest };
        }
        return item;
      });
      return changed ? next : prev;
    });
  }, [products]);

  // Load cart and promocode from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse cart from localStorage", e);
      }
    }
    const storedPromo = localStorage.getItem("appliedPromocode");
    if (storedPromo) {
      try {
        setAppliedPromocode(JSON.parse(storedPromo));
      } catch (e) {
        console.error("Failed to parse appliedPromocode from localStorage", e);
      }
    }
  }, []);

  // Save cart and promocode to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
    if (appliedPromocode) {
      localStorage.setItem("appliedPromocode", JSON.stringify(appliedPromocode));
    } else {
      localStorage.removeItem("appliedPromocode");
    }
  }, [items, appliedPromocode]);

  const addItem = (product: Product, itemId: string, format: "paper" | "digital", quantity: number = 1): boolean => {
    let wasAdded = false;
    setItems((prev) => {
      const existing = prev.find((item) => item.itemId === itemId);
      if (existing) {
        // For digital items, don't increase quantity - they can only have qty 1
        if (format === "digital") {
          wasAdded = false;
          return prev; // No change
        }
        // For paper items, update quantity
        wasAdded = true;
        return prev.map((item) =>
          item.itemId === itemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      // Add new item (digital items always have quantity 1)
      wasAdded = true;
      return [...prev, { product, itemId, quantity: format === "digital" ? 1 : quantity, format }];
    });
    return wasAdded;
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.itemId !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((item) =>
        item.itemId === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedPromocode(null);
  };

  const applyPromocode = async (code: string) => {
    const productItemIds = items.map(item => item.itemId);
    const promo = await validatePromocode(code, productItemIds);
    setAppliedPromocode(promo);
  };

  const removePromocode = () => {
    setAppliedPromocode(null);
  };

  const isInCart = (itemId: string): boolean => {
    return items.some((item) => item.itemId === itemId);
  };

  const openCart = () => {
    if (cartOpenCallbackRef.current) {
      cartOpenCallbackRef.current();
    }
  };

  // Method to register the callback from NavBar
  const registerOpenCallback = (callback: () => void) => {
    cartOpenCallbackRef.current = callback;
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, isInCart, openCart, registerOpenCallback, appliedPromocode, discountAmount, getItemDiscount, applyPromocode, removePromocode }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
