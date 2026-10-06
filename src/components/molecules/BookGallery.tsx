"use client";
import { useRef, useState } from "react";
import ImageCarousel from "@/components/organisms/ImageCarousel";
import { useDialogA11y } from "@/lib/dialog-a11y";
import styles from "./BookGallery.module.css";

export default function BookGallery({ open, onClose, images, title }: {
  open: boolean; onClose: () => void; images: string[]; title: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const visibleIndex = Math.min(currentIndex, images.length - 1);
  useDialogA11y({ open, onClose, dialogRef: panelRef, lockScroll: true });
  if (!open) return null;
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="book-gallery-title"
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={styles.panel} ref={panelRef}>
        <header className={styles.header}>
          <h2 id="book-gallery-title">{title}</h2>
          <button type="button" aria-label="Закрити" onClick={onClose}>×</button>
        </header>
        <ImageCarousel images={images} alt={title} className={styles.gallery} sizes="(max-width: 640px) calc(100vw - 32px), 600px"
          slideClassName={styles.slide} imageFit="contain" navigationAlwaysVisible
          initialIndex={visibleIndex} onIndexChange={setCurrentIndex} />
        <p className={styles.count} role="status" aria-label={`Зображення ${visibleIndex + 1} з ${images.length}`}>
          {visibleIndex + 1} / {images.length}
        </p>
      </div>
    </div>
  );
}
