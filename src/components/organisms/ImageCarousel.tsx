"use client";
import Icon from "@/components/atoms/Icon";
import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  imageFit?: "cover" | "contain";
  navigationAlwaysVisible?: boolean;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
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
  initiallyVisible: boolean;
};

function CarouselImage({ src, index, alt, sizes, slideClassName, railRef, objectFit, priority, initiallyVisible }: CarouselImageProps) {
  const slideRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(index === 0 || initiallyVisible);

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
          fetchPriority={priority ? "high" : undefined}
          loading={priority || initiallyVisible ? "eager" : "lazy"}
          draggable={false}
          style={{ objectFit, objectPosition: "center", userSelect: "none" }}
        />
      )}
    </div>
  );
}

export default function ImageCarousel({ images, alt, sizes, className, slideClassName, navInside = true, ariaLabel, priorityFirstImage = false, imageFit, navigationAlwaysVisible = false, initialIndex = 0, onIndexChange }: ImageCarouselProps){
  const railRef = useRef<HTMLDivElement>(null);
  const startingIndex = useRef(Math.max(0, Math.min(initialIndex, images.length - 1)));
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [containerIsLandscape, setContainerIsLandscape] = useState(true);

  const onScroll = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const { scrollLeft, scrollWidth, clientWidth, clientHeight } = rail;
    setCanPrev(scrollLeft > 2);
    setCanNext(scrollLeft < scrollWidth - clientWidth - 2);
    if (clientWidth > 0) onIndexChange?.(Math.max(0, Math.min(images.length - 1, Math.round(scrollLeft / clientWidth))));
    if (clientWidth > 0 && clientHeight > 0) {
      setContainerIsLandscape(clientWidth > clientHeight);
    }
  }, [images.length, onIndexChange]);

  useLayoutEffect(() => {
    const rail = railRef.current;
    if (rail) rail.scrollTo({ left: startingIndex.current * rail.clientWidth, behavior: "instant" });
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
    <div className={`${styles.carousel} ${className || ""}`}>
      {/* The rail scrolls, so it has to be reachable and scrollable with the keyboard. */}
      <div
        className={styles.carouselRail}
        ref={railRef}
        role="group"
        aria-label={ariaLabel ?? (alt ? `Зображення: ${alt}` : "Зображення")}
        tabIndex={0}
      >
        {images.map((src, i) => (
          <CarouselImage
            key={src + i}
            src={src}
            index={i}
            alt={alt || ""}
            sizes={sizes}
            slideClassName={slideClassName}
            railRef={railRef}
            objectFit={imageFit ?? fitForIndex(i)}
            priority={priorityFirstImage && i === 0}
            initiallyVisible={initialIndex > 0 && i === initialIndex}
          />
        ))}
      </div>
      {images.length > 1 && (
        <div className={`${styles.carouselNav} ${navInside ? styles.inside : ""} ${navigationAlwaysVisible ? styles.alwaysVisible : ""}`}>
          <button className={styles.carouselBtn + " prev"} onClick={goPrev} disabled={!canPrev} aria-label="Попереднє фото">
            <Icon name="chevron-left" />
          </button>
          <button className={styles.carouselBtn + " next"} onClick={goNext} disabled={!canNext} aria-label="Наступне фото">
            <Icon name="chevron-right" />
          </button>
        </div>
      )}
    </div>
  );
}
