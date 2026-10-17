"use client";
import { useEffect, useState } from "react";

export interface VisualViewportBox {
  height: number;
  top: number;
}

/**
 * Tracks the visible viewport while `active`. iOS Safari shrinks the visual
 * viewport and scrolls it (offsetTop) when the on-screen keyboard opens, so
 * fixed overlays must follow both values to stay pinned to what is on screen.
 */
export function useVisualViewport(active: boolean): VisualViewportBox | null {
  const [viewport, setViewport] = useState<VisualViewportBox | null>(null);

  useEffect(() => {
    if (!active) return;

    const update = () => {
      const visualViewport = window.visualViewport;
      setViewport({
        height: Math.round(visualViewport?.height ?? window.innerHeight),
        top: Math.round(visualViewport?.offsetTop ?? 0),
      });
    };

    update();
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [active]);

  return viewport;
}
