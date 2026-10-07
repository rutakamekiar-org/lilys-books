"use client";
import React from "react";
import styles from "./books.module.css";
import BookCard from "@/components/molecules/BookCard";
import { useProducts } from "@/components/molecules/ProductsProvider";
import ProductsDataState from "@/components/organisms/ProductsDataState";

export default function BooksGrid() {
  const { products } = useProducts();

  if (!products || products.length === 0) {
    return <ProductsDataState headingLevel={2} />;
  }

  return (
    <div className={styles.grid}>
      {products.map((b, index) => (
        <BookCard key={b.id} product={b} priorityImage={index < 2} />
      ))}
    </div>
  );
}
