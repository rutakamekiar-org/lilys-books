"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Product } from "@/models/Product";
import { getProductBySlugLive, getProductsLive } from "@/lib/api";

interface ProductsContextType {
  products: Product[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  refreshProduct: (slug: string) => Promise<Product | null>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ 
  children, 
  initialProducts = [] 
}: { 
  children: ReactNode; 
  initialProducts?: Product[]; 
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const latestProducts = await getProductsLive();
      if (Array.isArray(latestProducts) && latestProducts.length > 0) {
        setProducts(latestProducts);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setIsLoading(false);
    }
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
    <ProductsContext.Provider value={{ products, isLoading, refresh, refreshProduct }}>
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
