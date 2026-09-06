"use client";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./ImageCarousel.module.css";
import { getImageMetadata } from "@/lib/image-metadata";

export type ImageCarouselProps = {
  images: string[];
  alt?: string;
  sizes?: string;
  className?: string; // wrapper (positioned)
  slideClassName?: string; // to inherit aspect via padding-top wrapping element
  navInside?: boolean; // place nav inside overlay (for hero)
  ariaLabel?: string;
  priorityFirstImage?: boolean;
};

type CarouselImageProps = {
  src: string;
  index: number;
  alt: string;
  sizes?: string;
  slideClassName?: string;
  railRef: React.RefObject<HTMLDivElement | null>;
  objectFit: "cover" | "contain";
  priority: boolean;
};

function CarouselImage({ src, index, alt, sizes, slideClassName, railRef, objectFit, priority }: CarouselImageProps) {
  const slideRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(index === 0);

  useEffect(() => {
    if (shouldRender) return;
    const slide = slideRef.current;
    const rail = railRef.current;
    if (!slide || !rail) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldRender(true);
        observer.disconnect();
      }
    }, { root: rail, rootMargin: "0px 50%", threshold: 0.01 });

    observer.observe(slide);
    return () => observer.disconnect();
  }, [railRef, shouldRender]);

  return (
    <div ref={slideRef} className={`${styles.carouselSlide} ${slideClassName || ""}`}>
      {shouldRender && (
        <Image
          src={src}
          alt={index === 0 ? alt : ""}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          draggable={false}
          style={{ objectFit, objectPosition: "center", userSelect: "none" }}
        />
      )}
    </div>
  );
}

export default function ImageCarousel({ images, alt, sizes, className, slideClassName, navInside = true, ariaLabel, priorityFirstImage = false }: ImageCarouselProps){
  const railRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [containerIsLandscape, setContainerIsLandscape] = useState(true);

  const onScroll = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const { scrollLeft, scrollWidth, clientWidth, clientHeight } = rail;
    setCanPrev(scrollLeft > 2);
    setCanNext(scrollLeft < scrollWidth - clientWidth - 2);
    if (clientWidth > 0 && clientHeight > 0) {
      setContainerIsLandscape(clientWidth > clientHeight);
    }
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    onScroll();
    rail.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(onScroll);
    ro.observe(rail);
    return () => { rail.removeEventListener("scroll", onScroll); ro.disconnect(); };
  }, [onScroll]);

  // Update nav state when images change (as scrollWidth might change)
  useEffect(() => {
    onScroll();
  }, [images, onScroll]);

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
    const image = getImageMetadata(images[index]);
    if (!image) return "cover";
    const imgIsLandscape = image.width > image.height;
    // Same orientation -> cover, opposite -> contain
    return (containerIsLandscape === imgIsLandscape) ? "cover" : "contain";
  }, [images, containerIsLandscape]);

  return (
    <div className={`${styles.carousel} ${className || ""}`} aria-label={ariaLabel}>
      <div className={styles.carouselRail} ref={railRef} role="group">
        {images.map((src, i) => (
          <CarouselImage
            key={src + i}
            src={src}
            index={i}
            alt={alt || ""}
            sizes={sizes}
            slideClassName={slideClassName}
            railRef={railRef}
            objectFit={fitForIndex(i)}
            priority={priorityFirstImage && i === 0}
          />
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
