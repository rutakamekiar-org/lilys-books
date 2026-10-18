"use client";
import { useState } from "react";
import ImageCarousel from "@/components/organisms/ImageCarousel";
import Dialog from "@/components/molecules/Dialog";
import styles from "./BookGallery.module.css";

export default function BookGallery({ open, onClose, images, title }: {
  open: boolean; onClose: () => void; images: string[]; title: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const visibleIndex = Math.min(currentIndex, images.length - 1);
  return (
    <Dialog open={open} onClose={onClose} title={title} lockScroll
      classNames={{ overlay: styles.overlay, panel: styles.panel, header: styles.header }}>
      <ImageCarousel images={images} alt={title} className={styles.gallery} sizes="(max-width: 640px) calc(100vw - 32px), 600px"
        slideClassName={styles.slide} imageFit="contain" navigationAlwaysVisible
        initialIndex={visibleIndex} onIndexChange={setCurrentIndex} />
      <p className={styles.count} role="status" aria-label={`Зображення ${visibleIndex + 1} з ${images.length}`}>
        {visibleIndex + 1} / {images.length}
      </p>
    </Dialog>
  );
}
