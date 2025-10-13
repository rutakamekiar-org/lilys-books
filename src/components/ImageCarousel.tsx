"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ImageCarousel.module.css";

export type ImageCarouselProps = {
  images: string[];
  alt?: string;
  sizes?: string;
  className?: string; // wrapper (positioned)
  slideClassName?: string; // to inherit aspect via padding-top wrapping element
  navInside?: boolean; // place nav inside overlay (for hero)
  ariaLabel?: string;
};

export default function ImageCarousel({ images, alt, sizes, className, slideClassName, navInside = true, ariaLabel }: ImageCarouselProps){
  const railRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  // Track per-image object-fit based on actual aspect ratio
  const [fits, setFits] = useState<("cover" | "contain")[]>([]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const onScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = rail;
      setCanPrev(scrollLeft > 2);
      setCanNext(scrollLeft < scrollWidth - clientWidth - 2);
    };
    onScroll();
    rail.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(onScroll);
    ro.observe(rail);
    return () => { rail.removeEventListener("scroll", onScroll); ro.disconnect(); };
  }, []);

  // When images change, detect their natural dimensions to decide fit mode
  useEffect(() => {
    if (!images || images.length === 0) { setFits([]); return; }
    let cancelled = false;
    const loaders = images.map((src, idx) => new Promise<"cover" | "contain">((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const isLandscape = (img.naturalWidth || 0) >= (img.naturalHeight || 0);
        resolve(isLandscape ? "cover" : "contain");
      };
      img.onerror = () => resolve("contain");
      img.src = src;
    }));
    Promise.all(loaders).then((results) => {
      if (cancelled) return;
      setFits(results);
    });
    return () => { cancelled = true; };
  }, [images]);

  function scrollToDelta(delta: number){
    const rail = railRef.current;
    if (!rail) return;
    const { clientWidth, scrollLeft } = rail;
    if (clientWidth === 0) return;
    const currentIndex = Math.round(scrollLeft / clientWidth);
    const maxIndex = Math.max(0, images.length - 1);
    const nextIndex = Math.min(maxIndex, Math.max(0, currentIndex + delta));
    rail.scrollTo({ left: nextIndex * clientWidth, behavior: "smooth" });
  }

  function goPrev(){ scrollToDelta(-1); }
  function goNext(){ scrollToDelta(1); }

  const fitForIndex = useMemo(() => (index: number) => {
    return fits[index] || "contain"; // default to contain to avoid cropping verticals before measure
  }, [fits]);

  return (
    <div className={className} aria-label={ariaLabel}>
      <div className={styles.carouselRail} ref={railRef} role="group">
        {images.map((src, i) => (
          <div key={src + i} className={`${styles.carouselSlide} ${fitForIndex(i) === "contain" ? styles.portrait : ""} ${slideClassName || ""}`}>
            <Image
              src={src}
              alt={alt || ""}
              fill
              sizes={sizes}
              loading="lazy"
              draggable={false}
              style={{ objectFit: fitForIndex(i), objectPosition: "center", userSelect: "none" }}
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className={`${styles.carouselNav} ${navInside ? styles.inside : ""}`} aria-hidden>
          <button className={styles.carouselBtn + " prev"} onClick={goPrev} disabled={!canPrev} aria-label="Попереднє фото">
            <i className="fa-solid fa-chevron-left" aria-hidden></i>
          </button>
          <button className={styles.carouselBtn + " next"} onClick={goNext} disabled={!canNext} aria-label="Наступне фото">
            <i className="fa-solid fa-chevron-right" aria-hidden></i>
          </button>
        </div>
      )}
    </div>
  );
}
