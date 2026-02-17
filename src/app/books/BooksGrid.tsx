"use client";
import React from "react";
import styles from "./books.module.css";
import BookCard from "@/components/molecules/BookCard";
import { useProducts } from "@/components/molecules/ProductsProvider";

export default function BooksGrid() {
  const { products } = useProducts();

  if (!products || products.length === 0) {
    return <p className={styles.empty}>Поки що немає книг для відображення.</p>;
  }

  return (
    <div className={styles.grid}>
      {products.map((b) => (
        <BookCard key={b.id} product={b} />
      ))}
    </div>
  );
}
