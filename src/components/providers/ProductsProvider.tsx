"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { Product } from "@/models/Product";
import { getProductBySlugLive, getProductsLive } from "@/lib/api";

interface ProductsContextType {
  products: Product[];
  isLoading: boolean;
  hasError: boolean;
  refresh: () => Promise<void>;
  refreshProduct: (slug: string) => Promise<Product | null>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ 
  children, 
  initialProducts = [],
  initialHasError = false,
}: { 
  children: ReactNode; 
  initialProducts?: Product[]; 
  initialHasError?: boolean;
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(initialHasError);
  const inFlight = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async () => {
    if (inFlight.current) return inFlight.current;
    setIsLoading(true);
    setHasError(false);
    const request = (async () => {
      try {
        const latestProducts = await getProductsLive();
        // Preserve the existing warm-cache presentation. A successful cold
        // empty response still completes loading without showing an error.
        if (latestProducts.length > 0) setProducts(latestProducts);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
        inFlight.current = null;
      }
    })();
    inFlight.current = request;
    return request;
  }, []);

  const refreshProduct = useCallback(async (slug: string): Promise<Product | null> => {
    try {
      const latestProduct = await getProductBySlugLive(slug);
      if (!latestProduct) return null;

      setProducts((currentProducts) => {
        const exists = currentProducts.some((product) => product.id === latestProduct.id);
        return exists
          ? currentProducts.map((product) => product.id === latestProduct.id ? latestProduct : product)
          : [...currentProducts, latestProduct];
      });

      return latestProduct;
    } catch (error) {
      console.error(`Failed to fetch product by slug: ${slug}`, error);
      return null;
    }
  }, []);

  // Fetch on first load and whenever the customer returns to this tab.
  useEffect(() => {
    refresh();

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => document.removeEventListener("visibilitychange", refreshWhenVisible);
  }, [refresh]);

  return (
    <ProductsContext.Provider value={{ products, isLoading, hasError, refresh, refreshProduct }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductsProvider");
  }
  return context;
}
