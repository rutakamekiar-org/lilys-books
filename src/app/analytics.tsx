"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = 'G-G99TKQS1G1'

export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || !GA_MEASUREMENT_ID) return;

    const search = searchParams.toString();
    const url = search ? `${pathname}?${search}` : pathname;

    // Send a pageview to Google Analytics
    window.gtag?.("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }, [pathname, searchParams]);

  return null;
}
