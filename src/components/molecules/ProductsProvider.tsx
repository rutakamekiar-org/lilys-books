"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product } from "@/models/Product";
import { getProducts } from "@/lib/api";

interface ProductsContextType {
  products: Product[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ 
  children, 
  initialProducts = [] 
}: { 
  children: ReactNode; 
  initialProducts?: Product[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const latestProducts = await getProducts();
      if (latestProducts && latestProducts.length > 0) {
        setProducts(latestProducts);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  };

  // Fetch once per visit (on mount)
  useEffect(() => {
    refresh();
  }, []);

  return (
    <ProductsContext.Provider value={{ products, isLoading, refresh }}>
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
