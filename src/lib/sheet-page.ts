"use client";
import { useEffect, useState } from "react";

export const SHEET_PAGE_QUERY = "(max-width: 640px)";

let pages = 0;
let savedScrollY = 0;

/**
 * On phones, shows an open sheet as the page itself instead of a fixed overlay.
 *
 * iOS Safari pans and resizes the visual viewport around a focused field, and a
 * fixed overlay can only chase that with JavaScript, so it jumps. While a sheet
 * page is open the storefront's header, main and footer are hidden (see
 * globals.css) and the sheet sits in normal document flow, so the keyboard
 * scrolls it natively like any page. Counted so the cart -> checkout handover
 * keeps page mode and the original scroll position.
 *
 * Returns whether page mode applies, so callers can skip the desktop scroll lock.
 */
export function useSheetPage(open: boolean): boolean {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.matchMedia(SHEET_PAGE_QUERY).matches);

  useEffect(() => {
    const query = window.matchMedia(SHEET_PAGE_QUERY);
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const active = open && mobile;

  useEffect(() => {
    if (!active) return;
    if (pages++ === 0) {
      savedScrollY = window.scrollY;
      document.documentElement.dataset.sheetPage = "";
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    return () => {
      if (--pages > 0) return;
      delete document.documentElement.dataset.sheetPage;
      window.scrollTo({ top: savedScrollY, behavior: "instant" });
    };
  }, [active]);

  return mobile;
}
