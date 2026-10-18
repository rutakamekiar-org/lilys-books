"use client";

import { useEffect } from "react";

export default function ClarityInit() {

  // Load Clarity only after the page has finished loading so it stays out of the initial bundle.
  useEffect(() => {
    const id = 'te9lhzi6aj';
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const init = () => {
      timeout = setTimeout(async () => {
        try {
          const { default: Clarity } = await import("@microsoft/clarity");
          if (!cancelled) Clarity.init(id);
        } catch {
          // Ignore adblocker or CSP errors
        }
      }, 800); // Delay 0.8s to allow styles to apply
    };

    if (document.readyState === "complete") {
      init();
    } else {
      window.addEventListener("load", init, { once: true });
    }

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      window.removeEventListener("load", init);
    };
  }, []);

  return null;
}
